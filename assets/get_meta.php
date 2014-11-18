<?php

    $DBH = new PDO("sqlite:tnc_media.sqlite");

    //alter table ogrgeojson add column 'photo or video' text;
    //update ogrgeojson set 'photo or video' = 'photo';
    //select media_file, [photo or video] from ogrgeojson where substr(media_file, length(media_file)-2,length(media_file)-1) = "AVI";
    //update ogrgeojson set [photo or video] = "video" where substr(media_file, length(media_file)-2,length(media_file)-1) = "AVI";

    $que = "SELECT * FROM ogrgeojson ORDER BY liked DESC";
    $req = $DBH->query($que);

    $r = $req->fetchAll();

    echo json_encode($r);
?>