/* 
 * Berry Core
 * @version 2.0.0
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
			'cache': true,
			'charset': 'UTF-8', // при значении false, скрипты будут загружаться согласно charset страницы
			'plugins_name' : '_coreplugins',
			'plugins_path': '/js/berry/berry.config.js' // URL для конфига плагинов по умолчанию
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

	berry.isArray = function(arr) {
		return Object.prototype.toString.call(arr) === '[object Array]'; // ;)
	}

	berry.isObject = function(obj) {
		return Object.prototype.toString.call(obj) === '[object Object]'; // ;)
	}

	berry.isFunction = function(func) {
		return Object.prototype.toString.call(func) === '[object Function]'; // ;)
	}
	
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
		if (berry.isObject(arguments[0]) /* typeof value === 'object' пропустит null */) {
			return berry._config(arguments[0], arguments[1]);
		}
		//Если первый аргумент не является строкой, то сообщаем об ошибке и возвращаем false
		else if (typeof arguments[0] !== 'string') {
			console.error('Не задано имя для модуля!');
			return false;
		}
		else {
			// создаем объект конфигурации модуля
			var config = {};

			// парсим все входящие аргументы функции, определяем их тип и заполняем внутренний объект аргументов
			for (var i = 0, l = arguments.length; i < l; i++) {
				var argument = arguments[i];

				// если аргумент является строкой, то значит это название модуля (name)
				if (typeof argument === 'string') config.name = argument;

				// если аргумент является массивом, то значит это массив зависимостей модуля (depents)
				else if ( berry.isArray(argument) ) config.depents = argument;

				// если аргумент является функцией, то значит это callback-функция (callback)
				else if ( berry.isFunction(argument) ) config.callback = argument;

				// если аргумент является обьектом, то значит это обьект дополнительных данных модуля
				else if ( berry.isObject(argument) /* typeof value === 'object' пропустит null */ ) config.data = argument;
			}

			// если аргументы не нашли, то поставим их значение по умолчанию равным false
			if (!config.depents) config.depents = [];
			if (!config.callback) config.callback = function() {};
			if (!config.data) config.data = { 
					inited : false,  // если data был пустой, то значит модуль не был инициализован и необходим
					require : true,
					path: (/\.(css|js)$/.test(config.name) ) ? config.name : false
				};
			
			//находим модуль, если такого модуля нет - создаем новый пустой.
			var module = (this.defined[config.name]) ? (this.defined[config.name]) : (this.defined[config.name] = {
				name: config.name,
				depents: config.depents,
				callback: config.callback,
				data: config.data,
				,
			});

			return berry._update(module);
		}
	}
	
	// AMD. Обновляем состояние определенных модулей, при необходмости создаем новый модуль
	berry._update = function(module, config) {
//		if( module.name != berry.config.AMD.plugins_name ) module.depents =  berry.unique( module.depents.concat([berry.config.AMD.plugins_name]) );
			
		// если переданы зависимости, до добавим их к текущим
		if ( berry.isArray(config.depents) ) module.depents = berry.unique( module.depents.concat(config.depents) );
		
		//обновляем общие данные
		if ( typeof config.data === 'object' ) {
			module.data.path = config.data.path;
			module.data.require = (config.data.require === null) ? false : true;
		} else {
			module.data.require = true;
		}
		
		// создаем хранилище переменных модуля
		if( !module.storage ) module.storage = [];


		if (/\.(css)$/.test(module.data.path)) module.data.type = 'html';

		//первоначальная инцииализация дефолтных значений
		//if (!module.inited) args.inited = false;

		//загружаем модуль если он необходим и все еще не был загружен
		if (this.STATE == 'ready' && module.data.inited !== true) return this._call( module );
		
		return module;
	}

	// AMD. Вызов модуля
	/* вызываем переданный модуль, определяем его зависимости */
	berry._call = function(module, callback) {
//		debugger;
		console.log('_CALL', module.name, module.data.inited, module.depents.length );
		
		return new Promise(function(resolve, reject) {
			// если в были определены зависимости для модуля и параметр require не равен null, то проверим весь список зависимостей и загрузим их
			if (module.depents.length > 0 && module.data.require !== null) {

				berry.stack = [module.name];
				// проверим массив зависимостей, если в нем есть значения (0, null, false), то такой модуль не будем загружать
				/*
					По логике мы можем передать в массиве зависимостей не только имя модуля, от который зависит текущий модуль,
					но и булевые значения или число элементов DOM, test по регулярному выражения - любое проверочное уравнение, которое возвращает true\false.
				*/

				var check = !module.depents.some(function(depent) {
					// если существует хотя бы одна зависимость,
                    // которая обращается в false, то выходим из цикла,
                    // функция some при этом вернет true;
                    // forEach же продолжил бы цикл до последнего элемента;
					return !depent;
				});

				// если перерменная необходимости загрузки все еще true, то модуль надо вызвать
				if (check === true) {

					//Запустим обновление модулей рекурсивно проверяя зависимости
					module.depents.forEach(function(depent) {
						if (typeof depent === 'string') {
							//добавим зависимость в массив
							berry.stack.push( berry.defined[depent] );

							berry._call( berry.defined[depent] ).then(function(module){
                                // модуль загружен;
                                //
                                berry.stack.pop();
                                if (berry.stack.length === 1 && berry.stack === module.name) {
                                    // все зависимости разрешены!!!
                                    // нужно решить, что далее с этим делать;)
                                }
                            }, function(module){
                                // нет необходимости грузить модуль;
                            });
						}
					});

					if (module.data.require === true) {
						berry.get(module).then(function(module){
                            resolve(module);
                        }, function(error, module){
                           // ошибка при загрузке модуля;
                           reject(module);
                        });
					} else {
                        resolve(module);
                    }
				}

				// если перерменная необходимости загрузки равна false, то значит нет необходимости грузить модуль
				else {
					// сбросим параметр require в null, это необходимо? если данный модуль будет вызван позже и пройдет проверку необходимости загрузки
					module.data.require = null;
					reject(module);
				}
			}

			/ параметр require не равен null, тогда обновим параметры модуль используя обьект аргументов
			else {
				berry.get(module).then(function(module){
                   resolve(module);
                }, function(error, module)r
                   // ошибка при загрузке модуля;
                   reject(module);
                });
			}
		});
	}

	// AMD. Вызов всех определенных модулей
	/* Инициализируем все модули, которые были определены ранее */
	berry._init = function() {
		var promises = [];
		
		for (var module in berry.defined) {
			berry._update(berry.defined[module]);
		}
		
		/*
		console.log('promises', promises);
		
		Promise.all(promises).then(function(module) {
			console.log('PROMISE', module);
		});
		*/
	}
	
	// AMD. Вызов всех определенных модулей
	/* Инициализируем все модули, которые были определены ранее */
	berry._request = function(module) {
		return berry._call(berry.defined[module]);
	}
	

	// AMD. Определения конфига
	berry._config = function(config, callback, require) {
		console.log('_config', arguments);
		
		var self = this;
		var done = false;
		var require = (require === null) ? null : true;

		var response = new Promise(function(resolve, reject) {
			// поочередно определяем переданные в объекте модули
			for (var name in config) {
				if (config.hasOwnProperty(name)) {
					var data = config[name];
					self.define(name, data.depents, data.callback, self.extend(data, {'require': require }));
				}
			};
		});				

		response.then(function(val) {
			// после определения всех модулей, запускаем callback-функцию, если она есть
			if (callback) (callback)();
		});
		
		return false;
	};

	// AMD. Получение библиотеки по url
	berry.get = function(module, url) {
		console.log('GET', module);
		
        var self = this;
        return new Promise(function(resolve, reject){
            // URL модуля
            var url = url || module.data.path || false;

            // Если url модуля есть, то будем его подгружать
            if (url) {
                self._xhr(url).then(function(response) {
                    if (berry.config.debug) console.info('Модуль ' + module.name + ' загружен', response);

                    module.response = response;

                    // передадим исполнение callback-функции в спец метод
                    berry._callback(module);

                    // модуль загружен - разрешен;
                    resolve(module);
                }, function(error) {
                    console.error("Ошибка!", error);
                    // модуль не загружен
                    reject(error, module);
                });
            }

            // Если url нет
            else {
                // передадим исполнение callback-функции в спец метод
                self._callback(module);

                // модуль разрешен;
                resolve(module);
            }
        });
	}
	
	// AMD. Загрузка библиотеки	по url
	berry._xhr = function(url) {
		// возвращаем новый Promise
		return new Promise(function(resolve, reject) {
			// создаем get запрос к серверу
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.onload = function() {
				if (xhr.status == 200) resolve(xhr.response) 
				else reject(Error(xhr.statusText)); // ошибка, отдаем её статус
			}
			
			// отлавливаем ошибки сети
			xhr.onerror = function() {
				кeject(Error("Network Error"));
			};			
			
			// Делаем запрос
			xhr.send();			
		});
	}		

	// AMD. Исполнение callback-функции
	berry._callback = function(module) {
		console.log('_CALLBACK:', module);

		// устанавливаем ключи, что модуль проиницилизирован и больше не запрашивается
		module.data.inited = true;
		module.data.require = false;

		if (this.config.debug) console.info('Модуль ' + name + ' загружен');

		// если у модуля определена callback-функция
		if (module.callback) this._scope(module);
	}	
	
	// AMD. Прокидывание переменных из callback-функцию в зависимые модули
	berry._scope = function(module) {
		if (this.config.debug) console.info('callback-фунция: ', name);
		
		console.log('_SCOPE', module);
		return false;

//		var a = module.response;
//		(a)();
		
//		module.returned = module.response.apply((module.callback)(module.storage));
//console.log( module.response.call() );

		module.storage = this._storage(module);

		module.returned = module.callback(module.storage);
		
//		var a = new Function('a', 'return (' + module.returned + ')(a)');
		
//		console.log('RESPONSE: ', a);

//		console.log('CALLBACK: ', module.callback );
		
//		console.log('RETURNED: ', module.returned );
		
//		console.log('FUNC', a);
		
		if (module.returned) module.storage[module.name] = module.returned;
		
		module.callback = (module.storage.length > 0) ? function() {} : false;
		if (this.config.debug) console.info(name + ' storage: ', module.storage);

		// вернем значение callback-функции модуля
		return module.returned;
	}

	// AMD. Сохраняем значение callback-функции, нужно для прокидывания в зависмые модули
	berry._storage = function(module) {
		if (!module) return {};

		var storage = module.storage || {};

		if (module.depents) {
			module.depents.forEach(function(name) {
				// т.к. зависимость может быть не только по модулю, то делаем через try\catch
				try {
					berry.extend(storage, berry.defined[name].storage);
				} catch (e) {
					if (berry.config.debug) console.log(e)
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
		
		var plugins;
		// определяем модуль с основными библиотеками
		/*
		if( berry.config.AMD.plugins_name && berry.config.AMD.plugins_path ) {
			this.define(berry.config.AMD.plugins_name, { path: berry.config.AMD.plugins_path }, function(plugins) {
				console.log('PLUGINS', plugins, arguments[0]);
				berry._config(plugins, false, null);	
			});
		}
		*/

		this.ready(function() {
			if (berry.config.debug) {}
			console.log('%cDOM ready', 'color: #409f00; font-weight: bold');
			
			berry.STATE = 'ready';
			berry._init();	
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
