/* 
 * Berry Core
 * @version 2.0.6
 * @author Kirill Ivanov
 */
; // предваряющие точка с запятой предотвращают ошибки соединений с предыдущими скриптами, которые, возможно не были верно «закрыты».
(function(window, document, undefined) {
	'use strict';
	
	// добавим заглушку консоли, если ее нет
	if (typeof console == "undefined") {
		window.console = {
			log: function() {},
			error: function() {},
			info: function() {}
		};
	}

	// создаем объект berry, если он не существует
	if (!window.berry) {
		window.berry = {};
		berry = window.berry;
	}

	// дефолтный конфиг проекта
	berry.config = {
		'AMD': {
			'repeat': 5,
			'cache': true,
			'charset': 'UTF-8', // при значении false, скрипты будут загружаться согласно charset страницы
			'plugins': '/js/berry/berry.config.js' // URL для конфига плагинов по умолчанию
		}
	};

	// метод Extend - расширяем свойства объекта
	berry.extend = function(obj) {
		obj = obj || {};

		for (var i = 1; i < arguments.length; i++) {
			if (!arguments[i]) continue;
			for (var key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					obj[key] = arguments[i][key];
				}
			}
		}
		return obj;
	}

	// метод Unique - только уникальные значения массива
	berry.unique = function(arr) {
		var a = [];
		for (var i=0, l=arr.length; i<l; i++) {
			if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
            a.push(arr[i]);
		}
		return a;
	};

	berry.ready = function(func) {
		if (document.readyState != 'loading') {
			func();
		} else {
			document.addEventListener('DOMContentLoaded', func);
		}
	}

	// AMD функционал
	// модули, которые были определены
	berry.defined = {};

	berry.STATE = 'loading';
	
	// AMD. Загрузка библиотеки	по url
	berry._get = function(url) {
		// возвращаем новый Promise
		return new Promise(function(resolve, reject) {
			// создаем get запрос к серверу
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.onload = function() {
				if (xhr.status == 200) resolve(xhr.response);
				else reject(Error(xhr.statusText)); // ошибка, отдаем её статус

				// отлавливаем ошибки сети
				xhr.onerror = function() {
				  reject(Error("Network Error"));
				};
			}
			
			// Делаем запрос
			xhr.send();			
		});
	}	

	// AMD. Получение библиотеки по url
	berry.get = function(name, url, callback) {
		var self = this;

		// найдем модуль в массиве определенных модулей
		var module = self.defined[name] || { data: {inited: false }};
		module.storage = self._storage(name, module);

		// URL модуля
		var url = url || module.data.path || false;

		// Если URL модуля есть, то будем его подгружать
		if (url) {
			berry._get(url).then(function(response) {
				
				console.log('NANE:', name);
				// ставим ключ инциализации в true
				berry.defined[name].data.inited = true;
				berry.defined[name].data.require = false;

				console.log('getting', name, module.data.inited);
				
				if (berry.config.debug) console.info('Модуль ' + name + ' загружен');

				// если у модуля определена callback-функция
				if (module.callback) berry._scope(name, module);
				return true;					
			}, function(error) {
				console.error("Ошибка!", error);
			});
		}

		// Если URL не нашли
		else {
			// ставим ключ инциализации в true
			self.defined[name].data.inited = true;
			
			// Проверим если callback-функция
			if (module.callback) berry._scope(name, module);
			return true;
		}
	}

	// AMD. Запрос модуля
	berry.require = function(depents, callback) {
		return false; // пока не используется %)
		
		var self = this;
		var done;

		if (typeof arguments[0] == 'string' || typeof arguments[0] == 'object') {
			depents = arguments[0];
		} else {
			console.error('Не могу определить имя модуля!');
			return false;
		}

		if (typeof arguments[1] != 'function') {
			callback = undefined;
		}

		if (typeof depents == 'string') {
			var name = depents;
			var module = self.defined[name];
			if (!module) {
				console.error('Модуль ' + name + ' не определен в системе');
				return false;
			} else {
				//если модуль уже был проиницилизирован, то выполняем нужную функцию
				if (module.inited) {
					if (typeof arguments[1] === 'boolean' && arguments[1] === true) {
						callback = module.callback;
					}

					if (callback) {
						var storage = self._storage();
						(callback)();
					}
				} else {
					self.define(name, module.depents, callback, false);
				}

				return true;
			}
		} else if (Object.prototype.toString.call(depents) === '[object Array]') {
			done = true;

			$.each(depents, function(i, name) {
				// если зависимость является булевой, то пропускаем ее
				if (typeof name == 'boolen') {
					return;
				}

				var response = self.require(name);
				if (!response) {
					done = false;
				}
			});

			if (done) {
				if (callback) {
					var storage = self._storage();
					(callback)();
				}
			}
		} else if (typeof depents === 'object') {
			done = true;
			$.each(depents, function(name, data) {
				// если зависимость является булевой, то пропускаем ее
				if (typeof name == 'boolen') {
					return;
				}

				var response = self.require(name, data.callback);
				if (!response) {
					done = false;
				}
			});
			if (done) {
				if (callback) {
					var storage = self._storage();
					(callback)();
				}
			}
		}
	}

	// AMD. Определение модуля
	/* парсим все аргументы, при необходимости заполняем дефолтными значениями. Далее передаем в функцию обновления */
	berry.define = function(name, depents, callback, data) {
		
		//Если первый полученный аргумент Объект и второй функция или не передан, то значит мы получили конфиг и обработаем его через специальную функцию.
		if (typeof arguments[0] === "object") {
			berry._config(arguments[0], arguments[1]);
			return false;
		}
		//Если первый аргумент не является строкой, то сообщаем об ошибке и возвращаем false
		else if (typeof arguments[0] !== 'string') {
			console.error('Не задано имя для модуля!');
			return false;
		} else {
			// создаем объект аргументов
			var args = {};

			// парсим все входящие аргументы функции, определяем их тип и заполняем внутренний объект аргументов
			for (var i = 0; i < arguments.length; i++) {
				var argument = arguments[i];

				// если аргумент является строкой, то значит это название модуля (name)
				if (typeof argument === 'string') args.name = argument;

				// если аргумент является массивом, то значит это массив зависимостей модуля (depents)
				else if (Object.prototype.toString.call(argument) === '[object Array]') args.depents = argument;

				// если аргумент является функцией, то значит это callback-функция (callback)
				else if (Object.prototype.toString.call(argument) === '[object Function]') args.callback = argument;

				// если аргумент является обьектом, то значит это обьект дополнительных данных модуля
				else if (typeof argument === 'object' && !Array.isArray(argument)) args.data = argument;
			}

			// если аргументы не нашли, то поставим их значение по умолчанию равным false
			if (!args.depents) args.depents = false;
			if (!args.callback) args.callback = false;
			if (!args.data) args.data = false;

			berry._update(args.name, args.depents, args.callback, args.data);
		}
	}
	
	// AMD. Обновляем состояние определенных модулей, при необходмости создаем новый модуль
	berry._update = function(name, depents, callback, data) {
		var self = this;
		var options = {};

		//находим модуль, если такого модуля нет - создаем новый пустой.
		var module = (self.defined[name]) ?
			(self.defined[name]) : (self.defined[name] = {
				name: name,
				depents: depents,
				callback: callback,
				data: data
			});
			
		//если переданы зависимости, до добавим их как новые, либо добавим их как дополнительные
		if (depents) {
			options.depents = depents;
			if (module.depents) options.depents = berry.unique(depents.concat(module.depents));
		}
		
		//обновляем общие даные
		if (data) {
			options.path = data.path;
			options.storage = data.storage;
			options.require = (data.require === null) ? false : true;
		} else {
			options.require = true;
		}

		//если в имени передан урл файла, сохраним урл
		if (/\.(css|js)$/.test(name)) {
			if (!options.path) options.path = name;
		}

		if (/\.(css)$/.test(options.path)) {
			options.type = 'html';
		}

		//первоначальная инцииализация дефолтных значений
		if (!module.inited) options.inited = false;

		module.data = berry.extend(data, options);
				//загружаем модуль если он необходим и все еще не был загружен
		//if (self.STATE == 'ready' && module.require === true && module.inited !== true) berry.get(name);
		if (self.STATE == 'ready' && module.data.inited !== true) self._define( module );
	}

	// AMD. Определение модуля
	/* парсим все аргументы и передаем в функцию обновления */
	berry._define = function(args, callback) {
//		console.log('_define', args);

		var module = berry.defined[args.name];
		console.log('MODULE', module.name, module.data.inited, args );
		
		// если в были определены зависимости для модуля и параметр require не равен null, то проверим весь список зависимостей и загрузим их
		if (args.depents && args.data.require !== null) {

			// перерменная необходимости загрузки
			var check = true;
			berry.stack = [args.name];
			// проверим массив зависимостей, если в нем есть значения (0, null, false), то такой модуль не будем загружать
			/*
				По логике мы можем передать в массиве зависимостей не только name модулей, от который зависит текущий модуль,
				но и булевые значения, например проверку на существование элементов DOM или значение test регулярного выражения,
				вобщем любое проверочное уравнение, которое возвращает true\false.
			*/
			args.depents.forEach(function(name) {
				if (!name) check = false;
			})

			// если перерменная необходимости загрузки все еще true, то модуль на до грузить
			if (check === true) {
				//Запустим обновление модулей рекурсивно проверяя зависимости
				var done = false;

				args.depents.forEach(function(depent) {
					if (typeof depent === 'string') {
						//добавим зависимость в массив
						berry.stack.push(args.depents[depent]);

						var response = berry._define(berry.defined[depent]);
						if( response ) done = true; 
					}
					else {
						done = true;
					}					
				});
			
				if (done && module.data.require === true) berry.get(args.name);
				return false;
			}

			// если перерменная необходимости загрузки равна false, то значит нет необходимости грузить модуль
			else {
				// сбросим параметр require в null, это необходимо если данный модуль будет вызван позже и пройдет проверку необходимости загрузки
				this.extend(args.data, { require: null });
				return false;
			}
		}

		// если параметр require не равен null, тогда обновим параметры модуль используя обьект аргументов
		else {
			berry.get(args.name);
			return false;
		}
	}

	// AMD. Вызов всех определенных модулей
	/* Инициализируем все модули, которые были определены ранее */
	berry._request = function() {
		for (var module in berry.defined) {
			berry._define(berry.defined[module]);
		}
	}

	// AMD. Определения конфига
	berry._config = function(config, callback, require) {
		var self = this;
		var done = false;
		var require = (require === null) ? null : true;

		// поочередно определяем переданные в объекте модули
		for (var name in config) {
			if (config.hasOwnProperty(name)) {
				var data = config[name];

				console.log('_CONFIG', name);

				var response = self.define(name, data.depents, data.callback, self.extend(data, {
					'require': require
				}));

				if (response) done = true;
			}
		};

		// после определения всех модулей, запускаем callback-функцию, если она есть
		if (done && callback)(callback)();
	};

	// AMD. Прокидывание переменных из callback-функцию в зависимые модули
	berry._scope = function(name, module) {
		var self = this;
		if (self.config.debug) console.info('callback-фунция: ', name);

		module.returned = (module.callback)(module.storage);

		if (module.returned) {
			module.storage[name] = module.returned;
		}

		module.callback = (module.storage.length > 0) ? function() {} : false;
		if (self.config.debug) console.info(name + ' storage: ', module.storage);

		// вернем значение callback-функции модуля
		//		return (function() {module.callback})();
		return module.returned;
	}

	// AMD. Сохраняем значение callback-функции, нужно для прокидывания в зависмые модули
	berry._storage = function(name, module) {
		var self = this;
		if (!module) {
			return {};
		}

		var storage = module.storage || {};

		if (module.depents) {
			module.depents.forEach(function(name) {
				try {
					self.extend(storage, self.defined[name].storage);
				} catch (e) {
					console.log(e);
				}
			});
		}

		return storage;
	}

	// инициалиация ядра
	berry.init = function() {
		this.core = {};

		// создаем пустой обьект для локализации
		this.core.locale = {};

		this.ready(function() {
			if (berry.config.debug) {}
			console.log('%cDOM ready', 'color: #409f00; font-weight: bold');
			
			if (typeof(berry.config.AMD.plugins) === 'string') {
				berry.STATE = 'ready';
				
				berry.get('AMDplugins', berry.config.AMD.plugins);
				berry._request();
			}
		});
	}

	// обратная совместимость с seed 1.0
	if (!window.$) {
		window.$ = {};

		$.define = berry.define;
		$.require = berry.require;
	}

	// ярлыки
	if (!window.define) window.define = berry.define;
	if (!window.require) window.require = berry.require;

	return berry.init();
})(window, document);