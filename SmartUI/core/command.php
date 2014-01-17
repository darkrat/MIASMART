<?php
 $cord_x=$_GET['c'];
//$cord_x=$_POST['c'];
 	$command = "echo \"$cord_x\" > /dev/ttyUSB0";
	exec($command,$output);
//echo $command;
?>