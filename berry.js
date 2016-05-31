/* 
* Berry Core
* @version 2.0.0
* @author Kirill Ivanov
*/

// предваряющие точка с запятой предотвращают ошибки соединений с предыдущими скриптами, которые, возможно не были верно «закрыты».
;(function (w, d, u) {
	'use strict';

// добавим заглушку консоли, если ее нет
	if (typeof console == "undefined") {
		window.console = {
			log: function() {},
			error: function() {},
			info: function() {}
		};
	}

// создаем объект berry
	if (!window.berry) {
		window.berry = {};
		berry = window.berry;
	}

// создаем пустой обьект конфига проекта
	berry.config = {
		'AMD' : {
			repeat : 5,
			cache : true
		}
	};
// создаем пустой обьект для хранения общих функций проекта
	berry.fn = {};

// метод Merge - расширяем свойства объекта
	berry.merge = berry.fn.merge = function(obj) {
		obj = obj || {};

		for(var i = 1; i < arguments.length; i++) {
			if(!arguments[i]) continue;
			for (var key in arguments[i]) {
				if(arguments[i].hasOwnProperty(key)) obj[key] = arguments[i][key];
			}
		}
		return obj;
	};

// AMD функционал
// модули, которые были определены
	berry.defined = {};

	if( !berry.plugins ) {
		berry.config.AMD.plugins = '/js/berry/beta/berry.plugins.js';
	}

// AMD. Загрузка библиотеки
	berry.get = function(name, url) {
		var self = this;

		var module = self.defined[name];
//		var storage = self._storage();
		var url = url || module.path || false;

		if( url ) {
			var n = d.getElementsByTagName("head")[0],
			s = d.createElement('script');
			s.type = 'text/javascript';
			s.src = url;
			n.appendChild(s);

			s.onload = function() {
				if(self.config.debug) { console.info('Модуль '+ name+' загружен'); }
				if(module) {
					module.inited = true;
					if(module.callback) {
						if(self.config.debug) { console.info('callback-фунция: ', name, module); }
						module.storage = (module.callback)($.berry.globals, storage[0],storage[1],storage[2],storage[3],storage[4],storage[5]);
						module.callback = false;
						if(self.config.debug) { console.info(name+' storage: ',module.storage); }
					}
				}
			};
		}
		else {
			if(module.callback)  {
				if(self.config.debug) { console.info('callback-фунция: ', name); }
				module.inited = true;
				module.storage = (module.callback)($.berry.globals, storage[0],storage[1],storage[2],storage[3],storage[4],storage[5]);
			}
		}
	};

	
// определения конфига
	berry._defineConfig = function(config, callback, require) {
		var self = this;
		var done = false;
		var require = (require === null) ? null : true;
		$.each(config, function(name, data) {
			var response = self.define(name, data.depents, data.callback, $.extend(data, {require : require}) );
			if(response) {
			done = true;
			}
		});
		if( done ) {
			if(callback) { (callback)(); }
		}
	}


	berry.init = function() {
		if( typeof(this.config.AMD.plugins) == 'string' ) {
			berry.get('plugins', this.config.AMD.plugins);
		}

		this._defineConfig(berry.config.AMD.plugins, false, null);


/*
// загрузка библиотеке из GET переданного в файл
			$('script').each(function(i, el) {
				var src = $(el).attr('src');
				if( /berry\.js\?AMD=true/.test( src ) ) {
					try {
						var query = src.replace('AMD=true','').replace(/(&|)cache=\d+/,'').split('?')[1];
						$.each(query.split('&'), function(j, param) {
							try {
								var name = param.split('=')[0];
								var value = param.split('=')[1];

								if( value == 'all' ) {
									var re = new RegExp(name);

									$.each(self.config.AMD.plugins, function(k, plugin) {
										if( re.test(k) ) {
											self.require(k);
										}
									});
								}

								else if( /,/.test(value) ) {
									$.each( value.split(','), function(k, plugin) {
										self.require(name+'.'+plugin);
									});
								}
								else if( value ) {
									self.require(name+'.'+value);
								}
								else {
									return;
								}
							}
							catch(e) {
								return;
							}
						});
					}
					catch(e) {
						//base._log(e);
					}
				}
			});
*/
	}


	berry.init();

/*
// AMD прототип
	berry.AMD.fn = berry.AMD.prototype = {
		init : function() {

		},

//Определяем модуль, парсим все аргументы, при необходимости заполняем дефолтными значениями. Далее передаем в функцию обновления
		define : function(name, depents, callback, data) {
			var self = this;
//Если первый полученный аргумент Объект и второй функция или не передан, то значит мы получили конфиг и обработаем его через специальную функцию.
			if( typeof arguments[0] === "object" ) {
				this._defineConfig(arguments[0], arguments[1]);
				return false;
			}

//Если первый аргумент не является строкой, то сообщаем об ошибке и возвращаем false
			else if( typeof arguments[0] !== 'string' ) {
				console.error('Не задано имя для модуля!');
				return false;
			}

			else {
				var args = {};

				self.stack = [name];

				$.each(Array.prototype.slice.call(arguments), function(i, argument) {
					if( typeof argument === 'string') { args.name = argument; }
					else if( $.isArray(argument) ) { args.depents = argument; }
					else if( $.isFunction(argument) ) { args.callback = argument; }
					else if( typeof argument === 'object' && !$.isArray(argument) ) { args.data = argument; }
				});

				if( !args.depents ) { args.depents = false; }
				if( !args.callback ) { args.callback = false; }
				if( !args.data ) { args.data = false; }

				if( args.depents && args.data.require !== null ) {

//Если в зависимостях стоит проверка на boolean и она не прошла, значит модуль этот грузить мы не будем
					var check = true;
					$.each(args.depents, function(i,el) {
						if( !el ) { check = false; }
					});
					if(check === true) {
//Запустим обновление модулей рекурсивно проверяя зависимости
						var done = false;

						$.each(args.depents, function(depent) {
							if( typeof args.depents[depent] === 'string' ) {
//добавим зависимость в массив
								self.stack.push(args.depents[depent]);
//проверим массив на повторение, чтобы не было циклической зависимости при вызове модулей
								if( !self._check() ) { throw new Error("berry: Ошибка! Обнаружена циклическая зависимость: "+self.stack); return false; }

								var response = self.define(args.depents[depent], ( typeof self.defined[args.depents[depent]] === 'object' ) ? self.defined[args.depents[depent]].depents : false, false );
								if(response) {
									done = true;
								}
							}
							else {
								done = true;
							}
						});

						if( done ) {
							this._update(args.name, args.depents, args.callback, args.data);
							return true;
						}
					}
					else {
						$.extend(args.data, { require : null });
						return false;
					}
				}
				else {
					this._update(args.name, args.depents, args.callback, args.data);
					return true;
				}
			}
		},

//Определение конфига
		_defineConfig : function(config, callback, require) {
			var self = this;
			var done = false;
			var require = (require === null) ? null : true;
			$.each(config, function(name, data) {
				var response = self.define(name, data.depents, data.callback, $.extend(data, {require : require}) );
				if(response) {
					done = true;
				}
			});
			if( done ) {
				if(callback) { (callback)(); }
			}
		},

//Обновляем состояние определенных модулей, при необходмости создаем новый модуль
		_update : function(name, depents, callback, data) {

			var self = this;
			var options = {};

//находим модуль, если такого модуля нет - создаем новый пустой.
			var module = ( self.defined[name] ) ? (self.defined[name]) : (self.defined[name] = {});

//если переданы зависимости, до добавим их как новые, либо добавим их как дополнительные
			if(depents) {
				options.depents = depents;
				if(module.depents) {
					options.depents = $.unique( depents.concat(module.depents) );
				}
			}

//обновляем callback-функцию
			if(callback) { options.callback = callback; }

//обновляем общие даные
			if(data) {
				options.path = data.path;
				options.name = data.name;
				options.storage = data.storage;
				options.require = ( data.require === null ) ? false : true;
			}
			else {
				options.require = true;
			}

//если в имени передан урл файла, сохраним урл
			if( /\.(css|js)$/.test(name) ) {
				if( !options.path ) { options.path = name; }
			}

			if( /\.(css)$/.test(options.path) ) { options.type = 'html'; }

//первоначальная инцииализация дефолтных значений
			if( !module.inited ) { options.inited = false; }

			$.extend(module, options);

//загружаем модуль если он  необходим и все еще не был загружен
			if( module.require === true && module.inited !== true ) { this._get(name); }

		},

//запрашиваем определенные модули
		require : function(depents, callback) {
			var self = this;
			var done;

			if( typeof arguments[0] == 'string' || typeof arguments[0] == 'object' ) { depents = arguments[0]; }
			else {
				console.error('Не могу определить имя модуля!');
				return false;
			}

			if( typeof arguments[1] != 'function' ) { callback = undefined; }

			if( typeof depents == 'string') {
				var name = depents;
				var module = self.defined[name];
				if( !module ) {
					console.error('Модуль '+ name +' не определен в системе');
					return false;
				}
				else {
//если модуль уже был проиницилизирован, то выполняем нужную функцию
					if( module.inited ) {
						if( typeof arguments[1] === 'boolean' && arguments[1] === true ) { callback = module.callback; }

						if(callback) {
							var storage = self._storage();
							(callback)($.berry.globals, storage[0],storage[1],storage[2],storage[3],storage[4],storage[5]);
						}
					}
					else {
						self.define(name, module.depents, callback, false);
					}
					return true;
				}
			}
			else if( Object.prototype.toString.call( depents ) === '[object Array]' ) {
				done = true;
				$.each(depents, function(i, name) {
// если зависимость является булевой, то пропускаем ее
					if(typeof name == 'boolen') { return; }

					var response = self.require(name);
					if(!response) { done = false; }
				});
				if( done ) {
					if(callback) {
						var storage = self._storage();
						(callback)($.berry.globals, storage[0],storage[1],storage[2],storage[3],storage[4],storage[5]);
					}
				}
			}

			else if( typeof depents === 'object' ) {
				done = true;
				$.each(depents, function(name, data) {
// если зависимость является булевой, то пропускаем ее
					if(typeof name == 'boolen') { return; }

					var response = self.require(name, data.callback);
					if(!response) { done = false; }
				});
				if( done ) {
					if(callback) {
						var storage = self._storage();
						(callback)($.berry.globals, storage[0],storage[1],storage[2],storage[3],storage[4],storage[5]);
					}
				}
			}
		},

		_get: function(name) {
			var self = this;

			var module = self.defined[name];
			var storage = self._storage();

			var url = module.path || false;
			if( url ) {
				$.ajax({
					url: url,
					async: false,
					cache: self.config.AMD.cache,
					type: 'GET',
					dataType: (module.type == 'html') ? 'html' : 'script',
					success: function(data) {
						if(module.type == 'html' && /\.css/.test(module.path) && data ) { $("head").append("<style>" + data + "</style>"); }
						if(self.config.debug) { console.info('Модуль '+ name+' загружен'); }
						module.inited = true;
						if(module.callback)  {
							if(self.config.debug) { console.info('callback-фунция: ', name, module); }
							module.storage = (module.callback)($.berry.globals, storage[0],storage[1],storage[2],storage[3],storage[4],storage[5]);
							module.callback = false;
							if(self.config.debug) { console.info(name+' storage: ',module.storage); }
						}
					},
					error: function(e) {
						module.inited = true;
						console.error('Ошибка при загрузке модуля '+ name, e);
					}
				});
			}
			else {
				if(module.callback)  {
					if(self.config.debug) { console.info('callback-фунция: ', name); }
					module.inited = true;
					module.storage = (module.callback)($.berry.globals, storage[0],storage[1],storage[2],storage[3],storage[4],storage[5]);
				}
			}

		},

		_storage : function() {
			var self = this;
			var storage = [];
			$.each(self.stack, function(i, name) {
				try { storage.push(self.defined[name].storage); }
				catch(e) {
					//base._log(e);
				}
			});

			return storage;
		},

		_check: function() {
			var self = this;
			var check = true;
			var temp = [];
			$.each(self.stack, function(i, el) {
				$.each(temp, function(j, obj) {
					if( el == obj ) { check = false; }
				});
				temp.push(el);
			});
			return check;
		},
		settings: function(options) {
			$.extend({}, this.config, options);
			return this;
		}
	}

*/
/*
	$.berry.core = $.fn.berryCore = core;

// создаем пустой обьект для локализации
	$.berry.core.locale = {};

	$.fn.berryAMD = new core.AMD();
	$.fn.berryDynamic = $.berry.core.dynamic = new core.dynamic();

//Shortcut
	$.define = function() {
		$.fn.berryAMD.define(arguments[0], arguments[1], arguments[2], arguments[3]);
	};

	$.require = function() {
		$.fn.berryAMD.require(arguments[0], arguments[1]);
	};

*/
	return berry;
})(window, document);