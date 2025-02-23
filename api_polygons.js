var url_prefix = "https://ibronevik.ru/taxi/c/gruzvill/api/v1/"; 
var admin = { 
 "login": "bot@ibronevik.ru", 
 "password": "btw0rd", 
 "type": "e-mail" 
}; 
var admin_token = "значение токена"; 
var admin_u_hash = "значение хеша"; 
function encode_data(obj){ 
 var data = []; 
 for (var key in obj){ 
  data.push(encodeURIComponent(key)+"="+encodeURIComponent(obj[key]));  
 } 
 data = data.join("&"); 
 return data; 
}

Авторизация и получение токена админа: 
var req = new XMLHttpRequest(); 
req.open('POST', url_prefix + "auth", false); 
req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
var post_obj = { 
 "login": admin.login, 
 "password": admin.password, 
 "type":  admin.type
} 
req.send(encode_data(post_obj)); 
var auth_hash = JSON.parse(req.response).auth_hash; 
req = new XMLHttpRequest(); 
req.open('POST', url_prefix + "token", false); 
req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
var post_obj = {"auth_hash": auth_hash}; 
req.send(encode_data(post_obj)); 
admin_token = JSON.parse(req.response).data.token; 
admin_u_hash = JSON.parse(req.response).data.u_hash; 

Получение многоугольников
req = new XMLHttpRequest(); 
req.open('GET', url_prefix + "data", false); 
req.send(); 
var cities = JSON.parse(req.response).data.data.map_place_polygons; 

Создание или редактирование многоугольника
req = new XMLHttpRequest(); 
req.open('POST', url_prefix + "data", false); 
req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
var post_obj = { 
 "token": bot_admin_token, 
 "u_hash": bot_admin_u_hash, 
 "data": JSON.stringify({
	"map_place_polygons":[
		{
			"id":"если не указан или указан, но не существует - создается новый, иначе редактируется",
			"var":"уникальное название-идентификатор на английском",//обязательно при создании
			"coordinates":
			[
				[
					[latitude1, longitude1], [latitude2, longitude2], [latitude3, longitude3], [latitude4, longitude4], [latitude1, longitude1]
				]
			],//обязательно при создании
			"ru":"уникальное название на русском",
			"en":"уникальное название на английском",
			"ar":"уникальное название на арабском",
			"fr":"уникальное название на французком",
			"es":"уникальное название на испанском",
			"json":{"какой-то ключ":"квкое-то значение"},
		}
	]
  }); 
}
req.send(encode_data(post_obj)); 

Создание или редактирование круга
req = new XMLHttpRequest(); 
req.open('POST', url_prefix + "data", false); 
req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
var post_obj = { 
 "token": bot_admin_token, 
 "u_hash": bot_admin_u_hash, 
 "data": JSON.stringify({
	"map_place_polygons":[
		{
			"id":"если не указан или указан, но не существует - создается новый, иначе редактируется",
			"var":"уникальное название-идентификатор на английском",//обязательно при создании
			"ru":"уникальное название на русском",
			"en":"уникальное название на английском",
			"ar":"уникальное название на арабском",
			"fr":"уникальное название на французком",
			"es":"уникальное название на испанском",
			"json":{
				"lat":"широта центра круга",
				"lng":"долгота центра круга",
				"radius":"радиус круга"
			},//обязательно при создании
		}
	]
  }); 
}
req.send(encode_data(post_obj)); 
