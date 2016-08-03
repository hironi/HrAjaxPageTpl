/* HrAjaxPageTpl 封装ajax方法使用laypage和artTemplate插件，可单独使用ajax方法 /By hairong.W */
	(function(global){

		"use strict";

		/*@param [可选] _obj 3个可选属性：
			page ：分页的DOM容器
			tpl ：渲染模板的script容器
			con : 渲染模板的DOM容器*/
		function HrAjaxPageTpl(_obj){ //该函数将artTemplate和layerPage插件整合使用
		    if(_obj){
		    	this.obj = {
		    	    leyerpage : {
		    	        //不设置page的话即不启用分页，设置了这个属性就启用了分页
		    	        page : _obj.page || null//用来渲染的分页的容器，值支持id名、原生dom对象，jquery对象
		    	    },
		    	    template : {
		    	        tpl : _obj.tpl || null, //用来渲染的script模板，值必须是id名
		    	        con : _obj.con || null //渲染后盛放html的容器，值支持原生dom对象，jquery对象
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
		        dataType:"JSON",
		        cache : false,//关闭ajax请求缓存
		        contentType : "application/x-www-form-urlencoded",
		        timeout : 10000 //请求超过10s则返回请求超时错误
		    };
		    var _this = this;
		    var thisOjb = _this.obj;
		    // url为必传项目，不传则报错
		    if(!_obj.url || typeof _obj.url != "string" || _obj.url.length == 0){
		        console.error("ajax请求中，url是必传项");
		        return;
		    }
		    if(thisOjb && thisOjb.template.tpl){
		    	// 请求开始前的loading效果：
		    	init_data.beforeSend = function(){
					// // init_data.context = _this;
		    		var iHtml = '<i class="hr-ui-loading" style="position: relative;left:50%;margin-left:-60px;margin-top:25px;display: inline-block;width: 120px;height: 50px;background-image: url(http://i1.letvimg.com/lc03_lecloud/201607/22/11/45/loading.gif);background-size: 100%;"></i>';
		    		thisOjb.template.con.html(iHtml);
		    	};
		    }
		    // 启用分页功能才缓存请求数据
		    if(thisOjb && thisOjb.leyerpage.page){
		    	var ajax_request_obj;
		    	_this.ajax_request_obj = {}; //缓存每次ajax请求时发送的obj
		    	ajax_request_obj = _this.ajax_request_obj;
		        // 深度克隆ajax请求的data数据，避免修改原始请求data
		        _obj.data = $.extend({},_obj.data);
		        ajax_request_obj.init = _obj;
		        successfn ? ajax_request_obj.successfn = successfn : (ajax_request_obj.successfn ? delete ajax_request_obj.successfn : null);
		        errorfn ? ajax_request_obj.errorfn = errorfn : (ajax_request_obj.errorfn ? delete ajax_request_obj.errorfn : null);
		    }
		    // $.extend中的{}是为了阻止修改init_data的原始值
		    $.ajax($.extend({},init_data,_obj)).done(function(data){
		    	if(thisOjb && thisOjb.template.tpl){ //如果开启模板，则渲染模板
		    		_this.setPageTpl(data.data);
		    	}
		        // ajax请求成功的回调函数：
		        successfn ? successfn(data) : "";
		    }).fail(function(xhr){
		    	thisOjb.template.con.html("");; //隐藏loading效果
		        // 请求失败后的回调函数：
		        errorfn ? errorfn(xhr) : "";
		        //请求超时，错误提示“重新刷新”：
		        if(xhr.status === 0 && xhr.statusText === "timeout") {
		        	alert("请求超时，请刷新试试");
		        	return;
		        }
		        //404 找不到页面的处理
		        if(xhr.status === 404){
		        	alert("没有请求到页面，请刷新试试。（错误妈：404）");
		        	return;
		        }
		        var responseJSON = xhr.responseJSON;
	        	alert((responseJSON && responseJSON.msg || xhr.statusText) + '  错误码:('+ (xhr.status || "") +')');
		    });
		};

		/*@param [必选] _data 渲染模板、分页所需要的data数据*/
		HrAjaxPageTpl.prototype.setPageTpl = function(_data){
			var _this = this,
				_thisObj = _this.obj;
		    _thisObj.template.tpl && _this.setTpl(_data); //执行渲染模板引擎方法
		    _thisObj.leyerpage.page && _this.setPage(_data); //执行渲染分页方法
		};

		/*@param [必选] _data 渲染分页所需要的data数据*/
		HrAjaxPageTpl.prototype.setTpl = function(_data){
			var _this = this , 
		    	tplObj = _this.obj.template , //模板对象
		    	tpl = tplObj.tpl ,
		    	con = tplObj.con;
		    if(tpl && con){
		        // 此处的items需要根据实际后台传给的字段名做修改：
		        if(_data){
		            con.html(template(tpl, _data));
		        }else{
		            con.html('<p class="null-tpl">没有匹配的结果，请重试</p>');
		        }
		    }else{
		        console.log("启用template模板功能失败，传入的参数不完整");
		    }
		};

		/*@param [必选] _data 渲染模板所需要的data数据*/
		HrAjaxPageTpl.prototype.setPage = function(_data){
			var _this = this,
				pageObj = _this.obj.leyerpage , //分页对象
				page = pageObj.page ,
				pageData = _data.page;
			if(page){
				if(_data && pageData){
				    laypage.dir = false //不加载默认css
				    laypage({
				        cont: page, //容器。值支持id名、原生dom对象，jquery对象。
				        pages: pageData.totalPage || false,  //通过后台拿到的总页数
				        first: false, //默认显示"首页"，将首页显示为数字1,。若不显示，设置false即可
				        last: pageData.totalPage  || false, //默认显示"尾页"，将尾页显示为总页数。若不显示，设置false即可
				        prev: '<', //若不显示，设置false即可
				        next: '>', //若不显示，设置false即可
				        curr: pageData.curPage || 1, //首次载入后的当前页
				        jump: function(obj,first){  //触发分页后的回调
				            //点击跳页触发函数自身，并传递当前页：obj.curr
				            if(!first){
				            	var curr_page = obj.curr , //点击的当前页
				            		ajax_request_obj = _this.ajax_request_obj , //ajax请求的整个对象，为HrAjaxPageTpl.prototype.ajax方法传入的_obj参数
				            		ajax_obj_init = ajax_request_obj.init ,
				            		ajax_successfn = ajax_request_obj.successfn ,
				            		ajax_errorfn = ajax_request_obj.errorfn ;
				                ajax_obj_init.data.curPage = curr_page;
				                _this.ajax(ajax_obj_init,ajax_successfn ? ajax_successfn : null,ajax_errorfn ? ajax_errorfn : null);
				            }
				        }
				    });
				}else{
					console.warn("启用分页功能失败，传入的分页数据出错");
				}
			}else{
			    // console.log("启用分页功能失败，传入的分页容器不完整");
			}
		};
		// 直接使用ajax方法：
		global.hrAjax = new HrAjaxPageTpl();
		// 不使用 `new` 来调用构造函数
	    global.hrAjaxPageTpl = function( obj ) {
	        return new HrAjaxPageTpl( obj );
	    };
	    // 冻结该全局对象，避免被修改：
	    Object.freeze(hrAjax);
	    Object.freeze(hrAjaxPageTpl);

	})(this);
