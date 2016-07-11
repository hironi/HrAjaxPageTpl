/* HrAjaxPageTpl 封装ajax方法使用laypage和artTemplate插件，可单独使用ajax方法 /By hairong.W */
(function(global){

	"use strict";

	/*@param [可选] _obj 3个可选属性：
		elPage ：分页的DOM容器
		elTpl ：渲染模板的script容器
		elTplBox : 渲染模板的DOM容器*/
	function HrAjaxPageTpl(_obj){ //该函数将artTemplate和layerPage插件整合使用
	    if(_obj){
	    	this.obj = {
	    	    leyerpage : {
	    	        //不设置elPage的话即不启用分页，设置了这个属性就启用了分页
	    	        elPage : _obj.elPage || null//用来渲染的分页的容器，值支持id名、原生dom对象，jquery对象
	    	    },
	    	    template : {
	    	        elTpl : _obj.elTpl || null, //用来渲染的script模板，值必须是id名
	    	        elTplBox : _obj.elTplBox || null //渲染后盛放html的容器，值支持原生dom对象，jquery对象
	    	    }
	    	};
	    }else{
	    	this.obj = null
	    }
	}

	/*@param [必选] _obj ajax请求的参数（包括url、data、success等）
	@param [可选] successfn 请求成功后的预留的回调函数接口（一般在success完成回调）
	@param [可选] errorfn 请求失败后的预留的回调函数接口（一般在error完成回调）*/
	HrAjaxPageTpl.prototype.ajax = function(_obj,successfn,errorfn){
	    var init_data = { //ajax请求的默认项
	        type : "GET",
	        cache : false,//关闭ajax请求缓存
	        contentType : "application/x-www-form-urlencoded",
	        timeout : 10000
	    };
	    // url为必传项目，不传则报错
	    if(!_obj.url || typeof _obj.url != "string" || _obj.url.length == 0){
	        console.error("ajax请求中，url是必传项");
	        return;
	    }
	    if(this.obj && this.obj.template.elTpl){
	    	// 请求开始前的loading效果：
	    	this.obj.template.elTplBox.html('<i class="loading-xxl"></i>');
	    }
	    // 启用分页功能才缓存请求数据
	    if(this.obj && this.obj.leyerpage.elPage){
	    	this.obj_data = {}; //缓存每次ajax请求时发送的obj
	        // 深度克隆ajax请求的data数据，避免修改原始请求data
	        _obj.data = $.extend({},_obj.data);
	        this.obj_data.obj = _obj;
	        successfn ? this.obj_data.successfn = successfn : (this.obj_data.successfn ? delete this.obj_data.successfn : null);
	        errorfn ? this.obj_data.errorfn = errorfn : (this.obj_data.errorfn ? delete this.obj_data.errorfn : null);
	    }
	    // $.extend中的{}是为了阻止修改init_data的原始值
	    $.ajax($.extend({},init_data,_obj)).done(function(data){
	        // ajax请求成功的回调函数：
	        successfn ? successfn(data) : "";
	    }).fail(function(xhr){
	        //请求超时，错误提示“重新刷新”：
	        if(xhr.status === 0 && xhr.statusText === "timeout"){
	            console.error("请求超时，请刷新试试");
	        }
	        //404 找不到页面的处理
	        if(xhr.status === 404){
	            console.error("没有请求到页面，请刷新试试。（错误妈：404）");
	        }
	        // 请求失败后的回调函数：
	        errorfn ? errorfn(xhr) : "";
	    });
	};

	/*@param [必选] _data 渲染模板、分页所需要的data数据
	@param [可选] callback 渲染完模板、分页后的回调函数*/
	HrAjaxPageTpl.prototype.setPageTpl = function(_data,callback){
	    var _this = this;
	    // _data //用来渲染tpl模板和分页的data数据
	    // 启用模板：
	    if(_this.obj.template.elTpl && _this.obj.template.elTplBox){
	        // 此处的items需要根据实际后台传给的字段名做修改：
	        if(_data && _data.items && _data.items instanceof Array && _data.items.length > 0){
	            _this.obj.template.elTplBox.html(template(_this.obj.template.elTpl, _data));
	        }else{
	            _this.obj.template.elTplBox.html('<p class="null-tpl">没有匹配的结果，请重试</p>');
	        }
	        
	    }else{
	        console.log("启用template模板功能失败，传入的参数不完整");
	    }
	    //启用分页
	    if(_this.obj.leyerpage.elPage){
	    	if(_data && _data.page){
		        laypage.dir = false //不加载默认css
		        laypage({
		            cont: _this.obj.leyerpage.elPage, //容器。值支持id名、原生dom对象，jquery对象。
		            pages: _data.page.totalPage || false,  //通过后台拿到的总页数
		            first: false, //默认显示"首页"，将首页显示为数字1,。若不显示，设置false即可
		            last: _data.page.totalPage  || false, //默认显示"尾页"，将尾页显示为总页数。若不显示，设置false即可
		            prev: '<', //若不显示，设置false即可
		            next: '>', //若不显示，设置false即可
		            curr: _data.page.curPage || 1, //首次载入后的当前页
		            jump: function(obj,first){  //触发分页后的回调
		                //点击跳页触发函数自身，并传递当前页：obj.curr
		                if(!first){
		                    _this.obj_data.obj.data.curPage = obj.curr;
		                    _this.ajax(_this.obj_data.obj,_this.obj_data.successfn ? _this.obj_data.successfn : null,_this.obj_data.errorfn ? _this.obj_data.errorfn : null);
		                }
		            }
		        });
		    }else{
		    	console.warn("启用分页功能失败，传入的分页数据出错");
		    }
	    }else{
	        console.log("启用分页功能失败，传入的分页容器不完整");
	    }
	    // 执行完此方法后的回调函数,方便在渲染完页面后按需做二次修改:
	    if(callback){
	        // 把分页容器、tpl模板容器、html容器、用于渲染的数据返回到回调函数中：
	        if(this.obj.leyerpage.elPage){
	            callback(_this,_data);
	        }else {
	            callback(_this,_data);
	        }
	    }
	}
	// 直接使用ajax方法：
	global.leAjax = new HrAjaxPageTpl();
	// 不使用 `new` 来调用构造函数
    global.leAjaxPageTpl = function( obj ) {
        return new HrAjaxPageTpl( obj );
    };
    // 冻结该全局对象，避免被修改：
    Object.freeze(leAjax);
    Object.freeze(leAjaxPageTpl);

})(this);
