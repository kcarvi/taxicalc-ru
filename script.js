
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;

var autocomplete_start, autocomplete_end;
var place_start, place_end;


function initialize() {
  directionsDisplay = new google.maps.DirectionsRenderer();
  var thisCity = new google.maps.LatLng(55.751244, 37.618423);
  var myOptions = {
    zoom:8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: thisCity
  }
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("directionsPanel"));

  var input_start = document.getElementById("startPlace");
  var input_end = document.getElementById("endPlace");

  var options = {
    componentRestrictions: {country:'ru'}
  }
  autocomplete_start = new google.maps.places.Autocomplete(input_start, options);
  google.maps.event.addListener(autocomplete_start, 'place_changed', function() {
    place_start = autocomplete_start.getPlace();
  });

  autocomplete_end = new google.maps.places.Autocomplete(input_end, options);
  google.maps.event.addListener(autocomplete_end, 'place_changed', function() {
    place_end = autocomplete_end.getPlace();
  });

  // mkadPolygon.setMap(map); // Рисуем МКАД на карте
  // domodedovoPolygon.setMap(map); // Рисуем Домодедово на карте
  // vnukovoPolygon.setMap(map); // Рисуем Внуково на карте
  // sheremetyevoPolygon.setMap(map); // Рисуем Шереметьево на карте
}

function calcRoute() {

  // Точка А и Б
  var start = document.getElementById("startPlace").value;
  var end = document.getElementById("endPlace").value;

  if (typeof(place_start) != 'undefined') {
    start = new google.maps.LatLng(place_start.geometry.location.lat(), place_start.geometry.location.lng());
  }
  if (typeof(place_end) != 'undefined') {
    end = new google.maps.LatLng(place_end.geometry.location.lat(), place_end.geometry.location.lng());
  }


  // Класс автомобиля (standart, comform, vip)
  let carClass = document.getElementById("сar-class").value;
  let carClassTariff = 0;
  switch (carClass) {
    case "standart" : carClassTariff = 2200; break;
    case "comfort" : carClassTariff = 3000; break;
    case "vip" : carClassTariff = 5000; break;
  }

  // Общяя стоимость поездки
  let price = 0;

  // Адрес входит в МКАД
  let mkad = false;

  // Встреча возврату
  let returnServices = false;
  if(document.getElementById("return").checked) {
    returnServices = true;
  }

  // Встреча с табличкой
  let meeting = 0;
  if(document.getElementById("meeting").checked) {
    meeting = 200;
  }

  // Стоимость 1 км
  var kmPrice = 35;
  if(carClass == "comfort") {
    kmPrice = 45;
  } else if(carClass == "vip") {
    kmPrice = 55;
  }

  // Проверяем входит ли конечный (начальный) пункт зоны тарифа МКАД (true or false)
  let mkadStart = checkMkad(start, mkadPolygon);
  let mkadEnd = checkMkad(end, mkadPolygon);

  // Проверяем входит ли конечный (начальный) пункт в зону тарифа - Аэропорт (true or false)
  let vnukovoStart = checkAirport(start, vnukovoPolygon);
  let vnukovoEnd = checkAirport(end, vnukovoPolygon);
  let sheremetyevoStart  = checkAirport(start, sheremetyevoPolygon);
  let sheremetyevoEnd  = checkAirport(end, sheremetyevoPolygon);
  let domodedovoStart  = checkAirport(start, domodedovoPolygon);
  let domodedovoEnd  = checkAirport(end, domodedovoPolygon);


  // Запрос для определения расстояние между start и end
  var request = {
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.DRIVING
  };

  directionsService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
      var price_for_selected = document.getElementById('price_for_selected');
      var myRoute = result.routes[0].legs[0];

      // Получаем расстояние между start и end в метрах и переводим в км
      var commonDistanse = myRoute.distance.value / 1000;

      // Конвертируем строки в цифры
      commonDistanse = Number(commonDistanse);
      meeting = Number(meeting);
      kmPrice = Number(kmPrice)

      /*

      Считаем стоимость поездки

      тарифы внутри МКАД

      стандарт 2200
      комфорт 3000
      вип 5000

      тарифы из МКАД в АЭРОПОРТ (и обратно)

      стандарт 3000
      комфорт 3500
      вип 5000 проводы, 6000 встреча

      тарифы из МКАД в ЗАМКАД (и обратно)

      стандарт 2200 + (расстояние от МКАД до точки Б * 35)
      комфорт 3000 + (расстояние от МКАД до точки Б * 45)
      вип 5000 + (расстояние от МКАД до точки Б * 55)

      тарифы из ЗАМКАД в АЭРОПОРТ (и обратно)

      стандарт 3000 + (расстояние от МКАД до точки А * 35)
      комфорт 3500 + (расстояние от МКАД до точки А * 35)
      вип 5000 проводы, 6000 встреча + (расстояние от МКАД до точки А * 35)

      А - откуда
      Б - куда
      
      */
      
      if(mkadStart && mkadEnd) {
        // тарифы внутри МКАД
        price = carClassTariff + meeting;
      } else if ((mkadStart) && (vnukovoEnd || sheremetyevoEnd || domodedovoEnd)) {
        // тарифы из МКАД в АЭРОПОРТ
        switch (carClass) {
          case "standart": carClassTariff = 3000; break;
          case "comfort": carClassTariff = 3500; break;
          case "vip": carClassTariff = 5000; break;
        }
        if(carClass === "vip" && returnServices) {
          carClassTariff = 5500;
        }
        price = carClassTariff + meeting;
      } else if((mkadEnd) && (vnukovoStart || sheremetyevoStart || domodedovoStart)) {
        // тарифы из АЭРОПОРТА в МКАД
        switch (carClass) {
          case "standart": carClassTariff = 3000; break;
          case "comfort": carClassTariff = 3500; break;
          case "vip": carClassTariff = 6000; break;
        }
        if(carClass === "vip" && returnServices) {
          carClassTariff = 5500;
        }
        price = carClassTariff + meeting;
      } else if(mkadStart && !mkadEnd && !vnukovoEnd && !sheremetyevoEnd && !domodedovoEnd) {
        // тарифы из МКАД в ЗАМКАД
        price = carClassTariff + (getDistanceFromMkadToPoint(end) * kmPrice) + meeting;
      } else if(!mkadStart && mkadEnd && !vnukovoStart && !sheremetyevoStart && !domodedovoStart) {
        // тарифы из ЗАМКАД в МКАД
        price = carClassTariff + (getDistanceFromMkadToPoint(start) * kmPrice) + meeting;
      } else if(!mkadStart && !mkadEnd && !vnukovoStart && !sheremetyevoStart && !domodedovoStart && (vnukovoEnd || sheremetyevoEnd || domodedovoEnd)){
        // тарифы из ЗАМКАД в АЭРОПОРТ
        switch (carClass) {
          case "standart": carClassTariff = 3000; break;
          case "comfort": carClassTariff = 3500; break;
          case "vip": carClassTariff = 5000; break;
        }
        if(carClass === "vip" && returnServices) {
          carClassTariff = 5500;
        }
        price = carClassTariff + (getDistanceFromMkadToPoint(start) * kmPrice) + meeting;
      } else if(!mkadStart && !mkadEnd && !vnukovoEnd && !sheremetyevoEnd && !domodedovoEnd && (vnukovoStart || sheremetyevoStart || domodedovoStart)) {
        // тарифы из АЭРОПОРТА в ЗАМКАД
        switch (carClass) {
          case "standart": carClassTariff = 3000; break;
          case "comfort": carClassTariff = 3500; break;
          case "vip": carClassTariff = 6000; break;
        }
        if(carClass === "vip" && returnServices) {
          carClassTariff = 5500;
        }
        price = carClassTariff + (getDistanceFromMkadToPoint(end) * kmPrice) + meeting;
      } else {
        price = carClassTariff + (commonDistanse * kmPrice) + meeting;
      }

      // Если выбрана встреча по возрату
      if(returnServices) {
        price+=price;
      }

      var innerHtml = '<div class="row">';
      innerHtml += '<div class="col-md-4">Расстояние: <b>' + myRoute.distance.text + '</b></div>';
      innerHtml += '<div class="col-md-4">Время в пути: <b>' + myRoute.duration.text + '</b></div>';
      innerHtml += '<div class="col-md-4">Стоимость: <b>' + Math.ceil(price) + ' руб. </b></div>';
      innerHtml += '</div>';
      price_for_selected.innerHTML = innerHtml;
    } else {
      var price_for_selected = document.getElementById('price_for_selected');
      var innerHtml = '<div class="alert alert-warning" role="alert">Не удалось проложить маршрут. Попробуйте указать место поблизости или ввести название на другом языке. Обязательно выберите один из предложенных системой вариантов в выпадающем списке.</div>';
      price_for_selected.innerHTML = innerHtml;
      var directionsPanel = document.getElementById('directionsPanel');
      directionsPanel.innerHTML = ' ';
    }
  });
}

window.onload = function(){

  var calc = document.getElementById('calc');
  var order = document.getElementById('order');

  initialize();

  calc.addEventListener('click', calcRoute);

  order.addEventListener('click', function(){

    let start = document.getElementById('startPlace').value;
    let end = document.getElementById('endPlace').value;
    let сarClass = document.getElementById('сar-class').value;
    let meeting = (document.getElementById('meeting').checked) ? "да" : "нет";
    let returnServices = (document.getElementById('return').checked) ? "да" : "нет";
    let name = document.getElementById('name').value;
    let number = document.getElementById('number').value;
    let date = document.getElementById('date').value;
    let time = document.getElementById('time').value;
    let seats = document.getElementById('seats').value;
    let suitcases = document.getElementById('suitcases').value;
    let child = document.getElementById('child').value;
    let childSeats = document.getElementById('child-seats').value;

    if( !document.getElementById('privacy').checked 
        || number === "" 
        || name === "" 
        || date === "" 
        || time === "" 
        || seats === "" 
        || child === "" ) {
      alert("Пожалуйста, заполните обязательные поля.");
      return;
    }


    var data = new FormData();
    data.append('start', start);
    data.append('end', end);
    data.append('сarClass', сarClass);
    data.append('meeting', meeting);
    data.append('returnServices', returnServices);
    data.append('name', name);
    data.append('number', number);
    data.append('date', date);
    data.append('time', time);
    data.append('seats', seats);
    data.append('suitcases', suitcases);
    data.append('child', child);
    data.append('childSeats', childSeats);


    
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        alert("Спасибо за заказ! В ближайшие 10 минут с Вами свяжется оператор.");
      }
    };
    xhr.open("POST", "mail.php");
    xhr.send(data);

  });

}



// Функция проверяет входит ли точка в зону Аэропрт
var checkAirport = function(place, polygon) {
  if( google.maps.geometry.poly.containsLocation(place, polygon) ) {
    return true;
  } else {
    return false;
  }
}

// Функция проверяет входит точка в зону МКАД
var checkMkad = function(place, polygon) {
  if( google.maps.geometry.poly.containsLocation(place, polygon) ) {
    return true;
  } else {
    return false;
  }
}
 

// МКАД

var mkadCoordinates = [
  new google.maps.LatLng(55.834570,37.393453),
  new google.maps.LatLng(55.870030,37.404440),
  new google.maps.LatLng(55.880815,37.442892),
  new google.maps.LatLng(55.888518,37.482717),
  new google.maps.LatLng(55.906997,37.530783),
  new google.maps.LatLng(55.909306,37.545889),
  new google.maps.LatLng(55.910076,37.578848),
  new google.maps.LatLng(55.900838,37.615927),
  new google.maps.LatLng(55.896988,37.653005),
  new google.maps.LatLng(55.893908,37.687338),
  new google.maps.LatLng(55.889288,37.712057),
  new google.maps.LatLng(55.881586,37.723043),
  new google.maps.LatLng(55.842281,37.798574),
  new google.maps.LatLng(55.824543,37.838400),
  new google.maps.LatLng(55.779775,37.843893),
  new google.maps.LatLng(55.713300,37.835653),
  new google.maps.LatLng(55.689310,37.828787),
  new google.maps.LatLng(55.653686,37.837026),
  new google.maps.LatLng(55.636636,37.816427),
  new google.maps.LatLng(55.616477,37.779348),
  new google.maps.LatLng(55.593980,37.738150),
  new google.maps.LatLng(55.583115,37.701071),
  new google.maps.LatLng(55.572247,37.679098),
  new google.maps.LatLng(55.574576,37.598074),
  new google.maps.LatLng(55.593980,37.517050),
  new google.maps.LatLng(55.613375,37.488211),
  new google.maps.LatLng(55.638962,37.457998),
  new google.maps.LatLng(55.683117,37.419546),
  new google.maps.LatLng(55.713300,37.386587),
  new google.maps.LatLng(55.731089,37.378347),
  new google.maps.LatLng(55.765098,37.370108),
  new google.maps.LatLng(55.791358,37.372854)
];
var mkadOptions = {
  path: mkadCoordinates,
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#0000FF",
  fillOpacity: 0.6
}
var mkadPolygon = new google.maps.Polygon(mkadOptions);


// Аэропорт Домодедово

var domodedovoCoordinates = [
  new google.maps.LatLng(55.430219,37.858826),
  new google.maps.LatLng(55.376806,37.926460),
  new google.maps.LatLng(55.390654,37.958046),
  new google.maps.LatLng(55.440542,37.891098)
];
var domodedovoOptions = {
  path: domodedovoCoordinates,
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#0000FF",
  fillOpacity: 0.6
}
var domodedovoPolygon = new google.maps.Polygon(domodedovoOptions);


// Аэропорт Внуково

var vnukovoCoordinates = [
  new google.maps.LatLng(55.598484,37.306596),
  new google.maps.LatLng(55.583545,37.246172),
  new google.maps.LatLng(55.594605,37.234842),
  new google.maps.LatLng(55.621948,37.267114)
];
var vnukovoOptions = {
  path: vnukovoCoordinates,
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#0000FF",
  fillOpacity: 0.6
}
var vnukovoPolygon = new google.maps.Polygon(vnukovoOptions);


// Аэропорт Шереметьево

var sheremetyevoCoordinates = [
  new google.maps.LatLng(55.958276,37.415250),
  new google.maps.LatLng(55.976146,37.459195),
  new google.maps.LatLng(55.989206,37.405293),
  new google.maps.LatLng(55.969998,37.371991)
];
var sheremetyevoOptions = {
  path: sheremetyevoCoordinates,
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#0000FF",
  fillOpacity: 0.6
}
var sheremetyevoPolygon = new google.maps.Polygon(sheremetyevoOptions);




// Функция вычисляет минимальное расстояние от точки до МКАД

function getDistanceFromMkadToPoint(point){

  let distanceArray = []; // массив со всеми расстояниями
  let pointA = point;
  let pointB;

  function calcDistance(pointA, pointB) {
    return (google.maps.geometry.spherical.computeDistanceBetween(pointA, pointB) / 1000).toFixed(2);
  }

  for (let i = 0; i<mkadCoordinates.length; i++) {
    pointB = mkadCoordinates[i];
    distanceArray.push(calcDistance(pointA, pointB));
  }

  let minDistance = Math.min.apply(null, distanceArray); // минимальное расстояние

  return minDistance;
}
