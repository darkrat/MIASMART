<?php
 $cord_x=$_GET['x'];
 $cord_y=$_GET['y'];
//$cord_x=$_POST['x'];
//$cord_y=$_POST['y'];
 	$command = "echo \"1:$cord_x:$cord_y:\" > /dev/ttyUSB0";
	exec($command,$output);
//echo $command;
?>