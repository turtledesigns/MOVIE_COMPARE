<?php

error_reporting(E_ALL);
ini_set('display_errors', 'On');
header ("Content-type: image/jpeg"); 

$url = $_GET['imgurl'];
$extension = substr($url, -3);

if ($extension == "png") {
	$im = imagecreatefrompng($url);
} else if ($extension == "gif") {
	$im = imagecreatefromgif($url);
} else {
	$im = imagecreatefromjpeg($url);
}

if ($extension == "png") {
	imagepng($im);
} else if ($extension == "gif") {
	imagegif($im);
} else {
	imagejpeg($im);
}
imagedestroy($im);
?>