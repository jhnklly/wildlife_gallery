<?php

//ogrinfo tnc_media.sqlite -sql "alter table ogrgeojson add column liked int default 0"

//Open the database mydb
$db = new SQLite3('tnc_media.sqlite');

$c = $_REQUEST['c']; 
$f = $_REQUEST['f']; 

// sqlite cannot drop columns! (nor rename them)

//echo "first row before the update\n";
//$row = $db->querySingle('SELECT * FROM ogrgeojson', true);
//var_dump($row);

$query = "SELECT liked FROM ogrgeojson where \"camera name\" = '$c' AND media_file = '$f'";
$query = "UPDATE ogrgeojson SET liked=liked+1 where \"camera name\" = '$c' AND media_file = '$f'";
// Update the record
$db->exec($query);


?>