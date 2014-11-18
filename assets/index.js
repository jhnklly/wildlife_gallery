/*jshint sub:true*/

//GIN Credits on map
$(function(){
    $('#ginCreditsContainer').hover(function(){
        $('#ginCreditsText').toggle(); 
    });
});

//Video play button hover effect
$(document).ready(function(){
    $("#play").hover(function() {
        $(this).attr("src","http://websites.greeninfo.org/tnc/wildlifemap/dev/img/play-hover.png");
            }, function() {
        $(this).attr("src","http://websites.greeninfo.org/tnc/wildlifemap/dev/img/play.png");
    });
});

videojs.options.flash.swf = "assets/vid/video-js/video-js.swf";

var BASE_URL = document.URL.split('?')[0].split('#')[0]; 
var MEDIA_DIR = BASE_URL;
var DATA, QUERIED_DATA, LIGHTBOX_VISIBLE;
var map;

var splitting_array = MEDIA_DIR.split('/');
splitting_array.pop();
splitting_array.pop();
MEDIA_DIR = splitting_array.join('/') + '/media/';

var originalStyle = {
    weight: 2,
    opacity: 1,
    color: '#ffffff',
    fillOpacity: 0.1    
};

var fuzzyBackgroundStyle = {
    weight: 7,
    opacity: 0.25,
    color: '#343434',
    fillOpacity: 0   
};

var highlightStyle = {
    weight: 2,
    opacity: 1,
    color: 'yellow',
    fillOpacity: 0.1
};


$.ajax({
  type: "POST",
  dataType: "json",
  url: "assets/get_meta.php", //Relative or absolute path to response.php file
  //data: data,
  success: function(data) {
    //DATA_WITH_VIDEO = data;
    DATA_WITH_VIDEO = { "type": "FeatureCollection", "features": [] };


    for (var i = 0; i < data.length; i++) {
        geojson_feature = { "type": "Feature", "properties": data[i] };
        DATA_WITH_VIDEO.features.push( geojson_feature );
    }

    DATA = {};
    // this blurg filters out video, but gets overridden right after
    DATA.features = $.grep(DATA_WITH_VIDEO.features, function (feature, i) {
        var filename = feature.properties['media_file'];
        return filename.substr(filename.length - 4) == '.JPG'; // This is a test; if true the feature is included
    });

    DATA = DATA_WITH_VIDEO;

    QUERIED_DATA = $.extend(true, {}, DATA);
    //data.features[0].properties.Moon = "New Moon";
    createControls(DATA);
    updateInitialQuery();
    //updateQuery();

  },
  error: function() {
    data = (function () {
        var json = null;
        $.ajax({
            'async': false,
            'global': false,
            'url': 'assets/get_meta.json',
            'dataType': "json",
            'success': function (data) {
                json = data;
            }
        });
        return json;
    })(); 

    DATA_WITH_VIDEO = { "type": "FeatureCollection", "features": [] };


    for (var i = 0; i < data.length; i++) {
        geojson_feature = { "type": "Feature", "properties": data[i] };
        DATA_WITH_VIDEO.features.push( geojson_feature );
    }

    DATA = {};
    DATA.features = $.grep(DATA_WITH_VIDEO.features, function (feature, i) {
        var filename = feature.properties['media_file'];
        return filename.substr(filename.length - 4) == '.JPG'; // This is a test; if true the feature is included
    });

    DATA = DATA_WITH_VIDEO;

    QUERIED_DATA = $.extend(true, {}, DATA);
    //data.features[0].properties.Moon = "New Moon";
    createControls(DATA);
    updateInitialQuery();
    //updateQuery();

  }
});

$(document).ready(function() {
    
    initMap();
    initControls();
    //updateQuery();
    //refreshGallery();
    // initLoadHashSharedState() after wireControls(); after refreshGallery()
});

function initControls() {
    $('#map-toggle').click(function(){
        if ( $('#map').is(":visible") ) {
            $('#map').slideUp(500);
        } else {
            $('#map').slideDown(500);
        }
    });
}

function showRequest(formData, jqForm, options) {
    // formData is an array; here we use $.param to convert it to a string to display it 
    // but the form plugin does this for you automatically when it submits the data 
    var queryString = $.param(formData); 
    return true;
}

function createControls(json) {
    var fields_values = {};
    
    //_.uniq(DATA.features,properties.Moon);
    //var ui_fields = ['Site Name','Animal','Sex','Juveniles','Moon Phase','photo or video'];
    var ui_fields = ['Site Name','Animal','Sex','Juveniles','Moon Phase','photo or video'];
    ui_fields = ui_fields.map(function (x) { return x.toLowerCase(); });
    
    for (var key in json.features[0].properties) {
        // skip these fields:
        if ( ui_fields.indexOf(key) < 0 ) {
            continue;
        }

        // Just check the first feature to get the ~10 field names
        //pluck: extract a list of property values
        fields_values[key] = _.pluck(json.features, key);
        
        a = _.pluck(DATA.features,'properties');
        b = _.pluck(a,key);
        //c = _.b.uniq().sortBy().value();
        /* Must clean json first:
            trim
            Proper case 
        */
        c = _.chain(b).uniq().sortBy().value();
        
        //select_html = $('<select data-placeholder="Choose&hellip;" class="filter_select" name="'+key+'" multiple="multiple"></select>');
        select_html = $('<select class="filter_select" name="'+key+'" multiple="multiple"></select>');
        
        _.each(c,function(val){
            option_html = '<option value="'+val+'">'+val+'</option>';
            $(select_html).append(option_html);
        });
        
        //filter_html = $('<form class="filter_item"></form>').append('<h2>'+key+'</h2>').append(select_html);
        filter_html = $('<h2>'+key+'<br></h2>').append(select_html);
        //.change(updateMainGallery());
        
        //$('.sidebar').append(filter_html);
        $('form#all_filters').append(filter_html);
    }

    // custom mourner suncalc select:
    select_html = $('<select class="filter_select" name="lighttime" multiple="multiple"></select>');
    
    lighttimes_arr = ['Day','Night','Twilight',]; 
    for (var i = 0; i < lighttimes_arr.length; i++) {
        option_html = '<option value="'+lighttimes_arr[i]+'">'+lighttimes_arr[i]+'</option>';
        $(select_html).append(option_html);
    }
    filter_html = $('<h2>time of day</h2>').append(select_html);
    $('form#all_filters').append(filter_html);

    
    wireControls();
    
    
    //jQuery Multiselect
    $(function(){
        $("select").multiselect({
            selectedList: 10
        });

        $('#clearAll').click(function(){
            $("select").multiselect("uncheckAll");
        });

    });
    
      
    //jQuery Slider-Range for Temperature
    $(function() {
    $( "#slider-temp" ).slider({
      range: true,
      min: 0,
      max: 105,
      values: [ 45, 75 ],
      slide: function( event, ui ) {
        $( "#temp" ).val( ui.values[ 0 ] + "F - " + ui.values[ 1 ] + "F");
      }
    });
    $( "#temp" ).val( $( "#slider-temp" ).slider( "values", 0 ) + "F - " + $( "#slider-temp" ).slider( "values", 1 ) + "F");
    });


    
}

function wireControls() {
    //$('.sidebar select').change(function() {
    $('#all_filters select').change(function() {
        updateQuery();
    });
    
    $('select[name="Site Name"]').change(function() {
        

    });

    //initLoadHashSharedState();

}


function initLoadHashSharedState() {

    //var query_params = $.url().param();
    var query_str = document.URL.split('#').pop();
    var query_params = query_str.split('&');

    for (var i = 0; i < query_params.length; i++) {
        //query_params[i].split('=');
        
        var param_name = query_params[i].split('=')[0];
        var param_value = query_params[i].split('=')[1];
        // select the select menu with the name equal to the given name
        selectr1 = '[name="'+query_params[i][0]+'"]';
        // then find the input with the value equal to the given value
        selectr2 = 'option[value="'+query_params[i][1]+'"]';
        
        $(selectr1).find(selectr2).attr('selected','selected');
        
        // if lightbox showing single image:
        if ( param_name == 'focus_item') {
            // find the thumbnail with this filename and click it
            var thm_id = '#' + param_value;
            $(thm_id).click();
        }
    }

    // then do the query
    //updateQuery();
}

function updateInitialQuery() {
    //debugger;

    var found = false;
    //var queryString = $('#myFormId').formSerialize(); 
    // for each form element grep the QUERIED_DATA and pass it along to the next grep

    //QUERIED_DATA = DATA;
    QUERIED_DATA = $.extend(true, {}, DATA);



        $('form#all_filters select').each(function() {
            var nam = $(this).prop('name');
            var valu = $(this).val();        
            if (valu) {
                grepThis(nam,valu,QUERIED_DATA);
            }
        });

    refreshGallery();
    
    $('#all_filters').ajaxForm({
        beforeSubmit: showRequest
    });    
    $('#all_filters').submit();

    //hashAppStateParamsToShare(false);
}

function updateQuery() {
    //debugger;

    var found = false;
    //var queryString = $('#myFormId').formSerialize(); 
    // for each form element grep the QUERIED_DATA and pass it along to the next grep

    //QUERIED_DATA = DATA;
    QUERIED_DATA = $.extend(true, {}, DATA);



        $('form#all_filters select').each(function() {
            var nam = $(this).prop('name');
            var valu = $(this).val();        
            if (valu) {
                grepThis(nam,valu,QUERIED_DATA);
            }
        });

    refreshGallery();
    
    $('#all_filters').ajaxForm({
        beforeSubmit: showRequest
    });    
    $('#all_filters').submit();

    hashAppStateParamsToShare(false);
}

function parseTime(timeString) {    
    if (timeString === '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i); 
    if (time === null) return null;

    var hours = parseInt(time[1],10);    
    if (hours == 12 && !time[4]) {
          hours = 0;
    }
    else {
        hours += (hours < 12 && time[4])? 12 : 0;
    }   
    var d = new Date();             
    d.setHours(hours);
    d.setMinutes(parseInt(time[3],10) || 0);
    d.setSeconds(0, 0);  
    return d;
}

var lt_arr = [];
    
function dateTime2LightTime(time_time, date_date, text) {
    var lightwindow;
    if (text===true) {
        //time_time = parseTime(time_time + ', ' + date_date);
        time_time = parseTime(time_time);
        date_date = Date.parse(date_date);
    }
    var lat=36.9177;
    var lon=-121.5482;
    
    //pic_date = Date.parse('12\/10\/2012');
    // pic_date = Date.parse(props['Date Picture was Taken']);
    //debugger;
    LightTimes = SunCalc.getTimes(date_date, lat, lon);
    
    // convert suncalc.gettimes obj to array, so we can sort
    lt_arr = [];
    for (var key in LightTimes) {
        lt_arr.push( [LightTimes[key], key] );
    }
    // sort array
    lt_arr.sort(function (a, b) {
        if (a[0] < b[0])
            return -1;
        else if (a[0] > b[0])
            return 1;
        else
            return 0;
    });
    
    var daySeconds = date2daySeconds(time_time);
    var lightSeconds = 0;
    var lightwindow_idx = 0;

    for (var i = 0; i < lt_arr.length; i++) {
        lightSeconds = date2daySeconds(lt_arr[i][0]);
        lightwindow_idx = i;
        
        // if ToD of photo gets to a suncalc time that is greater, we're done
        if (lightSeconds > daySeconds) {
            //return lt_arr[i][1];
            break;
        }
        lightwindow = lt_arr[i][1];
    }

    lightwindow = 'Night';
    if ( lightwindow_idx > 2) { lightwindow = 'Twilight'; }
    if ( lightwindow_idx > 5) { lightwindow = 'Day'; }
    if ( lightwindow_idx > 9) { lightwindow = 'Twilight'; }
    if ( lightwindow_idx > 12) { lightwindow = 'Night'; }

    return lightwindow;

    /*IT BECOMES: right after
    -----------------------
    0 NIGHT: nadir 
    1 NIGHT: nightEnd 
    2 TWILIGHT: nauticalDawn 
    3 TWILIGHT: dawn 
    4 TWILIGHT: sunrise 
    5 DAY: sunriseEnd 
    6 DAY: goldenHourEnd 
    7 DAY: solarNoon 
    8 DAY: goldenHour 
    9 TWILIGHT: sunsetStart 
    10 TWILIGHT: sunset 
    11 TWILIGHT: dusk 
    12 NIGHT: nauticalDusk 
    13 NIGHT: night */
    // Also: SunCalc.getMoonIllumination(/*Date*/ timeAndDate)
}

function date2daySeconds(date_date, text) {
    if (text===true) {
        date_date = Date.parse(date_date);
    }
    secs = date_date.getHours() * 60 * 60;
    secs += date_date.getMinutes() * 60;
    secs += date_date.getSeconds();
    return secs;
}

function grepThis(property, valu, JSON) {
    //jQuery.grep: Finds the elements of an array which satisfy a filter function. The original array is not affected
    //The filter function will be passed two arguments: the current array item and its index. 
    JSON.features = $.grep(JSON.features, function (feature, i) {
        // if multi-select:
        found = false;
        if (valu instanceof Array) {
            for (var i = 0; i < valu.length; i++) {
                if (property == 'lighttime') {
                    timeText = feature.properties['Time'];
                    dateText = feature.properties['Date Picture was Taken'];
                    time_time = parseTime(timeText);
                    date_date = Date.parse(dateText);
                    currLightTime = dateTime2LightTime(time_time, date_date);
                    if (valu[i] == currLightTime) {
                        found = true;
                    }
                    return found;
                } else if (valu[i] == feature.properties[property]) {
                    found = true;
                }
            }
            return found;
        } else {
            return feature.properties[property] == valu; // This is a test; if true the feature is included
        }

    });
    return JSON;
}

var LightTimes, pic_date;

function refreshGallery() {

    // QUERIED_DATA
    //debugger;
    var queried_array = QUERIED_DATA.features;

    $('#query_feedback').html(queried_array.length + ' total');
    
    $('#main_gallery').html('');

    css_grid_class = '';

    for (var i=0, l=queried_array.length; i<l; i++) {
        var props = queried_array[i].properties;
        var thumb_uri = '../thumbs/' + props['camera name'] +'/'+ props['media_file'];
        var thm_id = 'thm_' + props['camera name'] + '_' + props['media_file'].split('.')[0];
        var img_uri = '../media/' + props['camera name'] +'/'+ props['media_file'];
        
        var gallery_div;
        var file_parts = props['media_file'].split('.');
        var filebase = file_parts[0];
        var filetype = file_parts[file_parts.length - 1].toLowerCase();

        //var onom = onomatopoeiaE[props['animal']] || props['animal'] || ''; // if not defined, set to blank string
        var onom = props['animal'] || ''; // if not defined, set to blank string


        if ( filetype == 'avi' ) {
            //img_uri = encodeURIComponent( MEDIA_DIR + props['camera name'] +'/'+ props['media_file'] );
            //img_uri = MEDIA_DIR + props['camera name'] +'/'+ props['media_file'];
            //img_uri = '../../../media/' + props['camera name'] +'/'+ props['media_file'];
            img_uri = '../../../media/' + props['camera name'] +'/'+ filebase + '.mp4';
            //img_uri = 'EK000031.mp4';
            thumb_uri = '../thumbs/' + props['camera name'] +'/'+ filebase + 'thumb.jpg';
            if (thumb_uri == '../thumbs/C4/EK000031thumb.jpg') {
                //thumb_uri = '../thumbs/C4/EK000031thumb.gif';
            }
            // jwplayer: gallery_div = $('<div class="'+css_grid_class+'"><figure class="cap-bot"><a data-fancybox-group="gallery" data-type="swf" href="assets/vid/jwplayer.swf?file='+ img_uri +'&amp;autostart=true" class="fancybox-video" title="' + props['animal'] +'"><img id="'+ thm_id + '" class="gallery_thumb" src="'+ thumb_uri +'" ></a></figure></div>');
            var gd_html = '<div class="'+css_grid_class+'"><figure class="cap-bot">';
            gd_html += '<a data-fancybox-group="gallery" data-type="swf" href="assets/vid/';
            gd_html += 'jwplayer.swf?file='+ img_uri +'&amp;autostart=true"';
            gd_html += 'class="fancybox-video" title="' + onom +'">';
            gd_html += '<img id="'+ thm_id + '" class="gallery_thumb" src="'+ thumb_uri +'" >';
            gd_html += '<img id="play" src="http://websites.greeninfo.org/tnc/wildlifemap/dev/img/play.png">';
            gd_html += '</a></figure></div>';

            gallery_div = $(gd_html);
        } else {
            gallery_div = $('<div class="'+css_grid_class+'"><figure class="cap-bot"><a data-fancybox-group="gallery" href="'+ img_uri +'" class="fancybox" title="' + onom +'" onclick="hashAppStateParamsToShare(\''+thm_id+'\');"><img id="'+ thm_id + '" class="gallery_thumb" src="'+ thumb_uri +'" ></a></figure></div>');
        }

        $('#main_gallery').append(gallery_div);
    }
    //$('.lb-image').wheelzoom();
    
    $(".fancybox").fancybox({
        nextClick: true,
        arrows: true,
        afterShow: function() { 
            makeLikeable(); 
        }
    });


    $(".fancybox-video").on("click", function(){
        $.fancybox({
          href: this.href,
          type: $(this).data("type")
        }); // fancybox
        return false   ;
    }); // on

    
    initLoadHashSharedState();
}

function uri2id(uri) {
    
}

function initMap() {
    
    var satellite = L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
        attribution: '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a><img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
    });
    
    var mapbox = L.tileLayer('http://b.tiles.mapbox.com/v3/greeninfo.map-3x7sb5iq/{z}/{x}/{y}.jpg', {
        attribution: '<a target="_blank" href="http://www.mapbox.com">mapbox</a>',
        opacity: 0.35
    });//.addTo(map);
    
     var esri = L.tileLayer('http://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png', {
        attribution: '<a target="_blank" href="http://www.esri.com">esri</a>',
    });//.addTo(map);
    
    var cpad_highlights = L.tileLayer('http://tilestache-2.greeninfo.org/tilestache/tilestache.py/highlights_access/{z}/{x}/{y}.png',{
            opacity: 0.5,
            format:'image/png', 
            transparent:true
        }
    ); //no buildings
    var mapbox_labels_streets = L.tileLayer('http://a.tiles.mapbox.com/v3/greeninfo.map-qwnj26en/{z}/{x}/{y}.png',{opacity: 0.5}); //no buildings
    var landwater_hillshade = L.tileLayer('http://tilestache-2.greeninfo.org/tilestache/tilestache.py/landwater_hillshade/{z}/{x}/{y}.png', {
        attribution: '<a target="_blank" href="http://www.greeninfo.org">GreenInfo</a>'});
    
    map = L.map('map', {
        zoomControl: true
    }).setView([36.94, -121.51], 12);
    
    // Disable drag and zoom handlers.
    map.scrollWheelZoom.disable();

    map.attributionControl.setPrefix(''); // Don't show the 'Powered by Leaflet' text.

    mapbox.addTo(map);
    cpad_highlights.addTo(map);
    
    var baseMaps = {
        "Satellite": satellite,
        "Terrain": mapbox,
        "Map1": esri,
        "Map2": landwater_hillshade
    };

    var overlays = {
        "Protected Areas": cpad_highlights,
        "Streets and Towns": mapbox_labels_streets
    };

    L.control.layers(baseMaps,overlays).addTo(map);
    
    // control that shows state info on hover
    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = '<font size=4>' + ( props ? + props.Id + '. ' + props.Site : '<font color=gray size=3> ...</font>') + '</font>';
    };

    info.addTo(map);
    
    function style(feature) {
        return {
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.1
        };
    }
    
    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle(highlightStyle);

        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }
        
        info.update(layer.feature.properties);
    }

    var geojson;

    function resetHighlight(e) {
        var layer = e.target;

        layer.setStyle(originalStyle);

        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }
        
        info.update();

    }

    function featureClicked(e) {
        var layer = e.target;
        var sitename = layer.feature.properties.Site;
        $('select[name="site name"]').val(sitename);
        $('select[name="site name"]').multiselect('refresh');
        updateQuery();
    }

    function onEachFeature(feature, layer) {
        var popupContent = "<p>" + feature.properties.Id + ". " + feature.properties.Site + "</p>";
        layer.bindPopup(popupContent);
        
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: featureClicked
        });



    }

    L.geoJson(cameraloc, {
        style: fuzzyBackgroundStyle
    }).addTo(map);
    
    L.geoJson(cameraloc, {
        style: originalStyle,
        onEachFeature: onEachFeature
    }).addTo(map);

}

var LIGHT_TIME_GROUPS = [
    {
        "term": "sunrise",
        "group": "twilight",
        "def": "sunrise (top edge of the sun appears on the horizon)"
    },
    {
        "term": "sunriseEnd",
        "group": "twilight",
        "def": "sunrise ends (bottom edge of the sun touches the horizon)"
    },
    {
        "term": "goldenHourEnd",
        "group": "day",
        "def": "morning golden hour (soft light, best time for photography) ends"
    },
    {
        "term": "solarNoon",
        "group": "day",
        "def": "solar noon (sun is in the highest position)"
    },
    {
        "term": "goldenHour",
        "group": "day",
        "def": "evening golden hour starts"
    },
    {
        "term": "sunsetStart",
        "group": "twilight",
        "def": "sunset starts (bottom edge of the sun touches the horizon)"
    },
    {
        "term": "sunset",
        "group": "twilight",
        "def": "sunset (sun disappears below the horizon, evening civil twilight starts)"
    },
    {
        "term": "dusk",
        "group": "twilight",
        "def": "dusk (evening nautical twilight starts)"
    },
    {
        "term": "nauticalDusk",
        "group": "twilight",
        "def": "nautical dusk (evening astronomical twilight starts)"
    },
    {
        "term": "night",
        "group": "night",
        "def": "night starts (dark enough for astronomical observations)"
    },
    {
        "term": "nadir",
        "group": "night",
        "def": "nadir (darkest moment of the night, sun is in the lowest position)"
    },
    {
        "term": "nightEnd",
        "group": "night",
        "def": "night ends (morning astronomical twilight starts)"
    },
    {
        "term": "nauticalDawn",
        "group": "twilight",
        "def": "nautical dawn (morning nautical twilight starts)"
    },
    {
        "term": "dawn",
        "group": "twilight",
        "def": "dawn (morning nautical twilight ends, morning civil twilight starts)"
    }
];



function addImgIdToParams() {
    // $('#all_filters').append(<);
}

function updateLoves(camera, filename) {
    var number_of_loves = 1;
    $.get('assets/get.php?c='+camera+'&f='+filename,function(data,status){
        number_of_loves = data;
        $('a[data-camera="'+camera+'"][data-file="'+filename+'"]').find('.like-number').html(number_of_loves);
    });
}

function makeLikeable() {
    //img = document.getElementsByClassName('lb-image')[0];
    img = document.getElementsByClassName('fancybox-image')[0];
    
    //var a = $('.lb-image').attr('style');
    var a = $('.fancybox-image').attr('src');
    //var myRe = /url\((.*)\)/g;
    //var myArray = myRe.exec(a);
    //img_url = myArray[1];
    img_url = a;
    
    //img_url = $('.lb-image').attr('src');
    url_parts = img_url.split('/');
    filename = url_parts[ url_parts.length -1 ];
    camera = url_parts[ url_parts.length - 2 ];

    // make the element
    var number_of_loves = 1;
    $.get('assets/get.php?c='+camera+'&f='+filename,function(data,status){
        
        number_of_loves = data;

        //var like_button = '<div id="like_button"><a class="a-like" href="assets/sql.php?c='+camera+'&f='+filename+'" title="i heart this" data-file="'+filename+'" data-camera="'+camera+'"><center><div class="like-btn"><div class="like-icon">♥</div><div class="like-number">'+number_of_loves+'</div></div></center></a></div>';
        var like_button = '<div id="like_button" class="center-image-wrap">';
        like_button += '<a class="a-like" href="#" title="i heart this" data-file="'+filename+'" data-camera="'+camera+'">';
        like_button += '<img src="img/circle_heart_filled_wht_35.png" />';
        like_button += '<div class="like-number centered-text">'+number_of_loves+'</div>';
        like_button += '</a></div>';

        // add it to the lightbox
        $('.fancybox-title').find('.child').html('');
        $('.fancybox-title').find('.child').append(like_button);

        $('.a-like').click(function(){
            $.ajax({   
               type: 'POST',   
               url: 'assets/sql.php',
               data: {c:camera, f:filename},
               success: function() {updateLoves(camera, filename);}
            });        
        });

    });


}


function compileAppStateParamsToShare(focus_id) {
    // Since lightbox app will likely be fullscreen (no button), it should use hash url?

    // make up a set of params regarding the app's current state and hand back the object
    // typical use will be for serializing to an URL string for use with initLoadSharedState()
    var params = {};


    // for tnc wildlife cam map in particular
    // we only need the selection query, and lightbox image id if applicable
    params.query = '';
    
    if ( focus_id ) {
        params.focus_item = focus_id;
    }
    // todo: support for name with multiple values: params.name.join(',')

    // all set!
    return params;
}

function hashAppStateParamsToShare(focus_id) {
    var hash_obj = compileAppStateParamsToShare(focus_id); 
    var hash_str = $.param(hash_obj); // "query=&focus_item=EK000214.JPG"
    var hashless_url = document.URL.split('#')[0];
    var final_hash = hashless_url + '#' + hash_str;
    location.replace(final_hash);
}