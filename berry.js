/* 
 * Berry Core
 * @version 2.0.0
 * @author Kirill Ivanov
 */

;// предваряющие точка с запятой предотвращают ошибки соединений с предыдущими скриптами, которые, возможно не были верно «закрыты».
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
		'repeat' : 5,
		'cache' : true,
		'charset' : 'UTF-8', // при значении false, скрипты будут загружаться согласно charset страницы
		'plugins' : '/js/berry/berry.config.js' // URL для конфига плагинов по умолчанию
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
    berry.unique = function( arr ) {
		for ( var i = 1; i < arr.length; i++ ) {
			if ( arr[i] === arr[ i - 1 ] ) {
				arr.splice( i--, 1 );
			}
		}
		return arr;
	};
	
	 berry.ready = function(func) {
		if (document.readyState != 'loading'){
			func();
		} else {
			document.addEventListener('DOMContentLoaded', func);
		}
	}
	
    // AMD функционал
    // модули, которые были определены
    berry.defined = {};
	
	berry.STATE = 'loading';
	
	
	berry.xhr = function(url) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.send();

		xhr.onreadystatechange = function() {
			if (xhr.readyState != 4) return;
			if (xhr.readyState == 4) {
				console.log(xhr.response);
			}
		}
	}

    // AMD. Загрузка библиотеки
	berry.get = function(name, url, skip) {
        var self = this;
		
		// найдем модуль в массиве определенных модулей
		var module = self.defined[name] || {};
		module.storage = self._storage(name, module);

		// URL модуля
		var url = url || module.path || false;

		// Если URL модуля есть, то будем его подгружать
		if (url && !skip) {
			// создаем новый DOM объект SCRIPT и прописываем ему свойства, вставляем в HEAD
            var n = document.getElementsByTagName("head")[0],
                s = document.createElement('script');
				s.type = 'text/javascript';
				s.src = url;
				if( this.config.AMD.charset ) s.charset = this.config.AMD.charset;
//				n.appendChild(s);
				
				console.log( s )
				
				berry.xhr(url);			

			// биндим событие после загрузки
            s.onload = function() {
                if (self.config.debug) console.info('Модуль ' + name + ' загружен');

				// ставим треггер инциализации в true
                   module.inited = true;

				// если у модуля определена callback-функция
				if (module.callback) return berry._scope(name, module);
            }
        }
		
		// Если URL не нашли
		else {
			// Проверим если callback-функция
            if (module.callback) return berry._scope(name, module);
        }
    }

	// AMD. Запрос модуля
    berry.require = function(depents, callback) {
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
        }
		else {
			// создаем объект аргументов
            var args = {};
            berry.stack = [name];

			// парсим все входящие аргументы функции, определяем их тип и заполняем внутренний объект аргументов
            for (var i = 0; i < arguments.length; i++) {
                var argument = arguments[i];

				// если аргумент является строкой, то значит это название модуля (name)
				if (typeof argument === 'string') args.name = argument;
				
				// если аргумент является массивом, то значит это массив зависимостей модуля (depents)
//                else if (Array.isArray(argument)) args.depents = argument;
				else if ( Object.prototype.toString.call(argument) === '[object Array]' ) args.depents = argument;
				
				// если аргумент является функцией, то значит это callback-функция (callback)
//                else if (!!(argument && argument.constructor && argument.call && argument.apply)) args.callback = argument;
				else if ( Object.prototype.toString.call(argument) === '[object Function]' ) args.callback = argument;
				
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
	
	
	// AMD. Определение модуля
	/* парсим все аргументы и передаем в функцию обновления */
    berry._define = function(args) {
		// если в были определены зависимости для модуля и параметр require не равен null, то проверим весь список зависимостей и загрузим их
		if (args.depents && args.data.require !== null) {

			// перерменная необходимости загрузки
			var check = true;
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

						//проверим массив на повторение, чтобы не было циклической зависимости при вызове модулей
						if (!berry._check()) {
//							throw new Error("berry: Ошибка! Обнаружена циклическая зависимость: " + berry.stack);
//							return false;
						}
						
						var response = berry._define( berry.defined[depent] );
						if (response) done = true;
					}
					
					else {
						done = true;
					}
				});

				if (done && berry.STATE == 'ready' && args.data.require === true && args.data.inited !== true) {
					//berry._update(args.name, args.depents, args.callback, args.data);
					berry.get(args.name);
					return true;
				}
			}

			// если перерменная необходимости загрузки равна false, то значит нет необходимости грузить модуль
			else {
				// сбросим параметр require в null, это необходимо если данный модуль будет вызван позже и пройдет проверку необходимости загрузки
				this.extend(args.data, {
					require: null
				});
				
				return false;
			}
		}
		
		// если параметр require не равен null, тогда обновим параметры модуль используя обьект аргументов
		else {
			//berry._update(args.name, args.depents, args.callback, args.data);
			if (berry.STATE == 'ready') berry.get(args.name);
			return true;
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
		if (done && callback) (callback)();
    };

	// AMD. Прокидывание переменных из callback-функцию в зависимые модули
	berry._scope = function (name, module) {
		var self = this;
		if(self.config.debug) console.info('callback-фунция: ', name);

		module.returned = (function(){
			(module.callback)(module.storage);
		})();
		
		console.log( module.storage );
		
		if(module.returned) { module.storage[name] = module.returned; }

		module.callback = ( module.storage.length > 0 ) ? function() {} : false;
		if(self.config.debug) console.info(name+' storage: ', module.storage);

		// вернем значение callback-функции модуля
//		return (function() {module.callback})();
		return module.returned;
	}	
	
	// AMD. Обновляем состояние определенных модулей, при необходмости создаем новый модуль
    berry._update = function(name, depents, callback, data) {
        var self = this;
        var options = {};
		
        //находим модуль, если такого модуля нет - создаем новый пустой.
        var module = (self.defined[name])
						? (self.defined[name]) : (self.defined[name] = {
							name : name,
							depents : depents,
							callback : callback,
							data : data							
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
        }
		else {
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
		self.defined[name].data = module.data;

        //загружаем модуль если он необходим и все еще не был загружен
//		if (self.STATE == 'ready' && module.require === true && module.inited !== true) berry.get(name);
//		else if (self.STATE == 'ready' && module.inited !== true) self._define( self.defined[name] );
    }

	// AMD. Сохраняем значение callback-функции, нужно для прокидывания в зависмые модули
	berry._storage = function(name, module) {
		var self = this;
		if( !module ) { return {}; }

		var storage = module.storage || {};

		if( module.depents ) {
			module.depents.forEach(function(name) {
				try {
					self.extend(storage, self.defined[name].storage);
				}
				catch(e) {
					console.log(e);
				}
			});
		}

		return storage;
	}	

	// AMD. Проверка цепочки зависимостей
    berry._check = function() {
		return;
        var check = true;
        var temp = [];
		
        this.stack.forEach(function(i) {
            temp.forEach(function(j) {
                if (i == j) {
                    check = false;
                }
            });
            temp.push(i);
        });
		
		console.log(temp, check);
		
        return check;
    }

    berry.settings = function(options) {
        this.extend({}, this.config, options);
        return this;
    }

	// инициалиация ядра
    berry.init = function() {
        if (typeof(this.config.AMD.plugins) === 'string') {
			this.get('AMDplugins', this.config.AMD.plugins);
        }
        /*
	  else {
	  }
    */
//	    this._config(this.config.AMD.plugins, false, null);


        this.core = {};

        // создаем пустой обьект для локализации
        this.core.locale = {};
		
		this.ready(function() {
			if(berry.config.debug) {} console.log('%cDOM ready', 'color: #409f00; font-weight: bold');
			berry.STATE = 'ready';
			berry._request();
		});
    }

	// обратная совместимость с seed 1.0
	if( !window.$ ) {
		window.$ = {};
		
		$.define = berry.define;
		$.require = berry.require;
	}

	// ярлыки
    if (!window.define) window.define = berry.define;
    if (!window.require) window.require = berry.require;
	
    return berry.init();
})(window, document);