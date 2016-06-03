/* 
* Berry Config
* @version 2.0.0
* @author Kirill Ivanov
*/


'use strict';

// проверим существование объекта berry
if (!window.berry) {
	window.berry = {};
	berry = window.berry;
}

// список библиотек AMD ядра и зависимостей
berry.plugins = {
// Общие библиотеки
	"common.cookie" : {
		"path" : "/js/jquery/jquery.cookie.js"
	},
	"common.easing" : {
		"path" : "/js/jquery/jquery.easing.1.3.js"
	},
	"common.mousewheel" : {
		"path" : "/js/jquery/jquery.mousewheel.js"
	},
	"common.map" : {
		"path" : "/js/jquery/jquery.map.js"
	},
	"common.meta" : {
		"path" : "/js/jquery/jquery.metadata.js"
	},
	"common.tablesorter" : {
		"path" : "/js/jquery/jquery.tablesorter.2.10.js"
	},
	"common.tablednd-2.10" : {
		"path" : "/js/jquery/jquery.tablednd.js"
	},
	"common.synctranslit" : {
		"path" : "/js/jquery/jquery.synctranslit.min-utf8.js"
	},
	"common.base64" : {
		"path" : "/js/base64/base64.js"
	},
	"common.json" : {
		"path" : "/js/jquery/jquery.json.js"
	},

// библиотеки jQuery UI
	"ui.dialog" : {
		"path" : "/js/jquery/ui/jquery.ui.dialog.js"
	},
	"ui.datepicker" : {
		"path" : "/js/jquery/ui/jquery.ui.datepicker.js"
	},
	"ui.datepicker-ru" : {
		"path" : "/js/jquery/ui/jquery.ui.datepicker-ru-utf.js"
	},
	"ui.datepicker-extension" : {
		"path" : "/js/jquery/ui/jquery.ui.datepicker-extension.js"
	},
	"ui.timepicker" : {
		"path" : "/js/jquery/ui/jquery.ui.timepicker.js"
	},
	"ui.timepicker-ru" : {
		"path" : "/js/jquery/ui/jquery.ui.timepicker-ru.js"
	},
	"ui.mouse" : {
		"path" : "/js/jquery/ui/jquery.ui.mouse.js"
	},
	"ui.draggable" : {
		"path" : "/js/jquery/ui/jquery.ui.draggable.1.11.4.min.js"
	},
	"ui.slider" : {
		"path" : "/js/jquery/ui/jquery.ui.slider.1.11.4.js.js"
	},

// библиотеки html5
	"html5.jQueryPlugin" : {
		"path" : "/js/html5/jQueryPlugin.js"
	},
	"html5.HTML5Loader" : {
		"path" : "/js/html5/HTML5Loader.js"
	},
	"html5.HTML5Viewer" : {
		"path" : "/js/html5/HTML5Viewer.js"
	},

// библиотеки High Slide
	"high.slide" : {
		"path" : "/js/slide/highslide.4.1.13.packed.js"
	},
// библиотеки High Charts
	"high.charts" : {
		"path" : "/js/highstock/highcharts.4.1.9.js"
	},

// библиотеки berry
	"berry.buy" : {
		"path" : "/js/berry/jquery.berry.buy.js"
	},
	"berry.basket" : {
		"path" : "/js/berry/jquery.berry.basket.js",
		"depents": ['berry.gform', 'common.json']
	},
	"berry.carousel" : {
		"path" : "/js/berry/jquery.berry.carousel.js",
		"depents": ['common.easing']
	},
	"berry.compare" : {
//			"path" : "/js/berry/jquery.berry.compare.js"
	},
	"berry.dropdown" : {
		"path" : "/js/berry/jquery.berry.dropdown.js"
	},
	"berry.filter" : {
		"path" : "/js/berry/jquery.berry.filter.js",
		"depents": ['common.cookie']
	},
	"berry.gallery" : {
		"path" : "/js/berry/jquery.berry.gallery.js"
	},
	"berry.gform" : {
		"path" : "/js/berry/jquery.berry.gform.js",
		"depents" : ['berry.tooltip']
	},
	"berry.modal" : {
		"path" : "/js/berry/jquery.berry.modal.js",
		"depents" : ['ui.draggable']
	},
	"berry.page" : {
		"path" : "/js/berry/jquery.berry.page.js",
		"depents": ['common.cookie']
	},
	"berry.tab" : {
		"path" : "/js/berry/jquery.berry.tab.js"
	},
	"berry.tooltip" : {
		"path" : "/js/berry/jquery.berry.tooltip.js"
	},
	"berry.select" : {
		"path" : "/js/berry/jquery.berry.select.js",
		"depents": ['berry.dropdown']
	},
	"berry.ui" : {
		"path" : "/js/berry/jquery.berry.ui.js",
		"depents": ['berry.modal', 'berry.gform']
	},
	"berry.zoom" : {
		"path" : "/js/berry/jquery.berry.zoom.js"
	}
};

console.log( this )