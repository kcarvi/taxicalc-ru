<?php 

$start = strip_tags(trim($_POST['start']));
$end = strip_tags(trim($_POST['end']));
$сarClass = strip_tags(trim($_POST['сarClass']));
$meeting = strip_tags(trim($_POST['meeting']));
$returnServices = strip_tags(trim($_POST['returnServices']));
$name = strip_tags(trim($_POST['name']));
$number = strip_tags(trim($_POST['number']));
$date = strip_tags(trim($_POST['date']));
$time = strip_tags(trim($_POST['time']));
$seats = strip_tags(trim($_POST['seats']));
$suitcases = strip_tags(trim($_POST['suitcases']));
$child = strip_tags(trim($_POST['child']));
$childSeats = strip_tags(trim($_POST['childSeats']));


$message = 
  "Откуда: ". $start . 
  "\r\nКуда: " . $end . 
  "\r\nКласс автомобиля: " . $сarClass .
  "\r\nВстреча с табличкой: " . $meeting .
  "\r\nВстреча по возврату: " . $returnServices .
  "\r\nИмя: " . $name .
  "\r\nНомер телефона: " . $number .
  "\r\nДата: " . $date .
  "\r\nВремя: " . $time .
  "\r\nКоличество мест: " . $seats .
  "\r\nЧемоданы: " . $suitcases .
  "\r\nКоличество детей: " . $child .
  "\r\nДетские кресла: " . $childSeats;

mail('mail@example.com', 'Зазаз с сайта 123', $message);




