<?php

//ogrinfo tnc_media.sqlite -sql "alter table ogrgeojson add column liked int default 0"

//Open the database mydb
$db = new SQLite3('tnc_media.sqlite');

// sqlite cannot drop columns! (nor rename them)

$c = $_REQUEST['c']; 
$f = $_REQUEST['f']; 

/*$c = 'C1';
$f = 'EK000215.JPG';*/

$query = "SELECT liked FROM ogrgeojson where \"camera name\" = '$c' AND media_file = '$f'";
//echo "$query\n";

$row = $db->querySingle($query, true);
//var_dump($row);
echo $row['liked'];

?>