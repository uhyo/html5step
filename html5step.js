/*[16:03:15] ' bonpro: 0 ～ 6 / 9key :左側、11, 11Lkey: 7key側
　　 0 : 左矢印 [ギコ]
　　 1 : 左斜め矢印 [おにぎり]
　　 2 : 下矢印 [いよう]
　　 3 : おにぎり [左矢印]
　　 4 : 上矢印 [下矢印]
　　 5 : 右斜め矢印 [上矢印]
　　 6 : 右矢印 [右矢印]

7 ～ 10 / 9key :右側、11, 11Lkey: 5key側
※ 5, 7, 7iでは不要
　　 7 : 左矢印
　　 8 : 下矢印
　　 9 : 上矢印
　　10 : 右矢印

20 ～ 22 / 矢印一斉
　　20 : 通常矢印(7ikey : 矢印、9key :左側、11key: 7key側)
　　21 : 斜め矢印 [AA](11, 11Lkey: 7key側)
　　22 : 通常矢印2(9key :右側、11, 11Lkey: 5key側)※ 5, 7, 7iでは不要

30 ～ 49 / フリーズアロー
　　30 : フリーズアロー通常　　 (通常 / 矢印)
　　31 : フリーズアロー通常　　 (通常 / 帯)
　　32 : フリーズアロー斜め　　 (通常 / 矢印)
　　33 : フリーズアロー斜め　　 (通常 / 帯)
　　34 : フリーズアロー通常2　　(通常 / 矢印)
　　35 : フリーズアロー通常2　　(通常 / 帯)
　　36 : フリーズアローAA　　　 (通常 / 矢印)
　　37 : フリーズアローAA　　　 (通常 / 帯)
　　40 : フリーズアロー通常 　　(ヒット時 / 矢印)
　　41 : フリーズアロー通常 　　(ヒット時 / 帯)
　　42 : フリーズアロー斜め 　　(ヒット時 / 矢印)
　　43 : フリーズアロー斜め 　　(ヒット時 / 帯)
　　44 : フリーズアロー通常2　　(ヒット時 / 矢印)
　　45 : フリーズアロー通常2　　(ヒット時 / 帯)
　　46 : フリーズアローAA　 　　(ヒット時 / 矢印)
　　47 : フリーズアローAA　 　　(ヒット時 / 帯)

50 ～ 59 / フリーズアロー(矢印＋帯)
　　50 : フリーズアロー通常 　　(通常)
　　51 : フリーズアロー斜め　　 (通常)
　　52 : フリーズアロー通常2　　(通常)
　　53 : フリーズアローAA　 　　(通常)
　　55 : フリーズアロー通常 　　(ヒット時)
　　56 : フリーズアロー斜め 　　(ヒット時)
　　57 : フリーズアロー通常2　　(ヒット時)
　　58 : フリーズアローAA　 　　(ヒット時)

60 ～ 61 / フリーズアロー一斉
　　60 : フリーズアローALL 　　(通常)
　　61 : フリーズアローALL 　　(ヒット時
*/
/*
HTML5Step original

100 : 通常矢印+おにぎり 一斉
*/

function Onigiri(){
	this.statestring=null;	//状態の文字列
	this.selectmodeindex=0;	//モード選択
	
	this.keys= localStorage.keys ? JSON.parse(localStorage.keys) : {
		left_data:37,
		up_data:38,
		right_data:39,
		down_data:40,
		space_data:32,
	};
	this.processes=[];
	this.wrapper=null;
	
}
Onigiri.prototype={
	defaultHeader:{
		fps:60,	//60[frame/s] 変更非推奨（譜面が60fpsのため）
		renderfps:"r60",	//描画のフレームレート r・・・animationRequestFrame使用
		speedlock:1,//デフォルトスピード
		chars:{
			up_data:"↑",
			right_data:"→",
			down_data:"↓",
			left_data:"←",
			space_data:" ／■＼",
		},
		canvas:{
			x:550,
			y:350,
		},
		color:{
			background:"#000000",
			color:"#ffffff",
			error:"#ff4444",	//エラー時の文字列
			score:{
				great:"#00ffff",
				good:"#ff9900",
				bad:"#00b0ff",
				miss:"#ff0000",
				freezegood:"#ffff00",
				freezebad:"#00ff00",
			},
			arrow:{	//矢印
				left_data:"#cccccc",
				right_data:"#cccccc",
				up_data:"#cccccc",
				down_data:"#cccccc",
				space_data:"#cccccc",
			},
			freezearrow:{	//フリーズ矢印（通常）
				left_data:"#cccccc",
				right_data:"#cccccc",
				up_data:"#cccccc",
				down_data:"#cccccc",
				space_data:"#cccccc",
			},
			freezehitarrow:{	//フリーズ矢印（ヒット時）
				left_data:"#ffff00",
				right_data:"#ffff00",
				up_data:"#ffff00",
				down_data:"#ffff00",
				space_data:"#ffff00",
			},
			freezeband:{	//フリーズ帯
				left_data:"#0000ff",
				right_data:"#0000ff",
				up_data:"#0000ff",
				down_data:"#0000ff",
				space_data:"#0000ff",
			},
			freezehitband:{	//フリーズ帯（ヒット時）
				left_data:"#ddddaa",
				right_data:"#ddddaa",
				up_data:"#ddddaa",
				down_data:"#ddddaa",
				space_data:"#ddddaa",
			},
			gauge:{
				frame:"#aaaaaa",	//枠の色
				below:"#ffff00",	//ノルマ未達成のとき
				above:"#00ffff",	//ノルマを達成したとき
				alpha:0.8,		//透明度（1=不透明）
			},
		},
		font:{
			normal:"16px sans-serif",
			up_data:"30px sans-serif",
			right_data:"30px sans-serif",
			down_data:"30px sans-serif",
			left_data:"30px sans-serif",
			space_data:"30px sans-serif",
			
			score:"16px sans-serif",
		},
		fontinfo:{
			musictitle:{
				title:{
					font:"40px serif",
					x:30,y:80,
					color:"#ffffff",
				},
				author:{
					font:"22px serif",
					x:230,y:110,
				},
				mode:{
					font:"36px sans-serif",
					x:60,y:150,
					color:"#ffffff",
				},
				mode_selected:{
					font:"36px sans-serif",
					x:60,y:150,
					color:"#ff4444",
				},
				mode_desc:{
					font:"16px serif",
					x:60,y:300,
					color:"#ffffff",
				},
			},
			keyconfig:{
				normal:{
					font:"36px sans-serif",
					x:350,y:150,
					color:"#ffffff",
				},
				selected:{
					font:"36px sans-serif",
					x:350,y:150,
					color:"#ff0000",
				},
				message:{
					font:"16px sans-serif",
					x:100,y:250,
					color:"#ffffff",
				},
			},
			config:{
				normal:{
					font:"36px sans-serif",
					x:350,y:210,
					color:"#ffffff",
				},
				selected:{
					font:"36px sans-serif",
					x:350,y:210,
					color:"#ff0000",
				},
			},
			rank:{
				font:"54px serif",
				x:100,y:100,
				color:"#ccffff",
			}
		},
		//矢印基点y
		arrowy:100,
		//ノルマゲージの位置
		gaugepos:{
			x:0,
			y:0,
			width:30,
			height:350,
			framewidth:2,	//枠の太さ
		},
		//ノルマ
		norma:{
			init:50,	//最初
			max:100,	//最大
			fail:0,		//これ以下になると終了
			clear:75,	//ノルマ達成ライン
			score:{
				great:5,
				good:1,
				bad:-5,
				miss:-7,
				freezegood:6,
				freezebad:-3,
			},
		},
		//矢印位置
		pos:{
			left_data:40,
			down_data:100,
			up_data:160,
			right_data:220,
			space_data:280,
		},
		//情報表示位置x
		infox:380,
		//スコア名前
		scorename:{
			great:"（・∀・）ｲｲ!!",
			good:"(´∀｀)ﾏﾀｰﾘ",
			bad:"(´・ω・｀)ｼｮﾎﾞｰﾝ",
			miss:"ヽ(`Д´)ﾉｳﾜｧﾝ!!",
			freezegood:"(ﾟ∀ﾟ)ｷﾀｰ!!",
			freezebad:"(・A・)ｲｸﾅｲ",
		},
		//スコア数値換算
		scorevalue:{
			great:10,
			good:5,
			bad:2,
			miss:0,
			freezegood:10,
			freezebad:0,
		},
		//ランク（%で）
		rankstr:{
			PF:100,
			SS:97,
			S:94,
			SA:90,
			AAA:85,
			AA:75,
			A:65,
			B:50,
			C:35,
			D:20,
			E:0,
		},
		//特殊ランク
		rankspecial:{
			fullcomplete:"FC",	//missが0
			fail:"FAIL",	//ゲームオーバー
		},
		//捨てる幅[f]
		trashrange:30,
		
		//色デフォルト
		setColor:["#cccccc","#cccccc","#cccccc","#cccccc"],
		frzColor:["#dddddd","#dddddd","#eeeeee","#eeeeee"],
		
		//デフォルトのコンフィグ
		defaultConfig:{
			Reverse:"off",
			Speed:"x1",
			Correction:"0",
		},
		
		mediaURI:"sound.ogg",	//デフォルトではsound.oggから読み込み
		mediaType:"audio",
		
		//矢印のタイプ
		arrowType:"char",	// char/image/grayimage
		arrowImage:{
			up_data:"images/arrow_up.png",
			right_data:"images/arrow_right.png",
			down_data:"images/arrow_down.png",
			left_data:"images/arrow_left.png",
			space_data:"images/arrow_space.png",
		},
		
		//時間を表示するか
		timeinfo:true,
	},
	//プロセス開始
	startProcess:function(func,opt){
		var act=this.processes[this.processes.length-1];
		if(act && act.op)act.op(true);	//ポーズされた
		var pr=new Process(this);
		this.processes.push(pr);
		func(pr,opt);
	},
	//ファイルを読み込む
	loadFile:function(filename,cb){
		var req=new XMLHttpRequest();
		req.onload=function(){
			cb(req.responseText);
		};
		req.open("GET",filename,false);
		req.send(null);
	},
	//はじまり
	init:function(wrapper, headername){
		if(!headername){
			headername="header.json";
		}
		this.wrapper=wrapper;
	
		this.loadFile(headername,function(text){
			this.setHeader(JSON.parse(text));
		}.bind(this));
		wrapper.style.width=this.header.canvas.x+"px";
		// canvasを作る
		this.canvas=document.createElement("canvas");
		this.canvas.width=this.header.canvas.x,this.canvas.height=this.header.canvas.y;
		wrapper.appendChild(this.canvas);
		this.ctx=this.canvas.getContext("2d");
		//イベント登録
		this.events={
			"keydown":this.keydown.bind(this),
			"keyup":this.keyup.bind(this),
		};
		
		for(var x in this.events){
			document.addEventListener(x,this.events[x],false);
		}
		
		var f=this.header.renderfps, r=false;
		if(typeof f=="string" && f.charAt(0)=="r"){
			//requestAnimationFrame使用
			r=true;
			f=parseInt(f.slice(1));
		}
		
		//fps計測用
		this.fps=f;
		this.check=Date.now();
		
		// ループ開始
		var m,clear;
		if(r){
			var me;
			if(me=window.requestAnimationFrame){
				clear=window.cancelRequestAnimationFrame;
			}else if(me=window.webkitRequestAnimationFrame){
				clear=window.webkitCancelRequestAnimationFrame;
			}else if(me=window.mozRequestAnimationFrame){
				clear=window.mozCancelRequestAnimationFrame;
			}else if(me=window.oRequestAnimationFrame){
				clear=window.oRequestAnimationFrame;
			}
			if(me){
				m=function(func){
					var flag=true;//継続フラグ
					me(c);
					return clear;
					
					function c(){
						func();
						if(flag){
							me(c);
						}
					}
					
					
					function clear(){
						flag=false;
					}
				};
			}
		}
		if(!m){
			m=(function(f){
				return function(func){
					var timerid=setInterval(func,1000/f);
					return clear;
					function clear(){
						clearInterval(timerid);
					}
				};
			})(f);
		}
		//this.timerid=m(this.main.bind(this));
		this.clearer=m(this.main.bind(this));
		
		//ローディングプロセス
		this.startProcess(this.commands.loading);
	},
	//おわり
	end:function(){
		[this.canvas,this.audio,this.image].forEach(function(x){
			if(x && x.parentNode){
				x.parentNode.removeChild(x);
			}
		});
		if(this.audio){
			this.audio.pause();
			delete this.audio;
		}
		if(this.clearer){
			//clearInterval(this.timerid);
			this.clearer(this.timerid);
			//this.timerid=null;
		}
		for(var x in this.events){
			document.removeEventListener(x,this.events[x],false);
		}
	},
	//ヘッダをセット
	setHeader:function(obj){
		var opt=Object.create(this.defaultHeader);
		Object.getOwnPropertyNames(obj).forEach(function(x){
			if(obj[x]!=null){
				Object.defineProperty(opt,x,Object.getOwnPropertyDescriptor(obj,x));
			}
		});
		this.header=opt;
		this.loadAudio(this.header.mediaURI);
		//modeを配列に
		this.modes=Object.keys(opt.score).map(function(x){opt.score[x].name=x;return opt.score[x]});
		
		//色ロード
		["left_data","up_data","right_data","down_data","space_data"].forEach(function(x){
			opt.color.arrow[x]=opt.setColor[0];	//矢印上下左右（spaceはあとで上書き）
			opt.color.freezearrow[x]=opt.frzColor[0];
			opt.color.freezeband[x]=opt.frzColor[1];
			opt.color.freezehitarrow[x]=opt.frzColor[2];
			opt.color.freezehitband[x]=opt.frzColor[3];
		});
		opt.color.arrow.space_data=opt.setColor[2];	//おにぎり
		
		//コンフィグ
		this.config=(localStorage.HTML5Step_config ? JSON.parse(localStorage.HTML5Step_config):{});
		for(var c in opt.defaultConfig){
			if(typeof this.config[c]=="undefined" || this.config[c]==null){
				this.config[c]=opt.defaultConfig[c];
			}
		}
		//矢印ロード
		if(opt.arrowType=="image"){
			this.arrow_images={};
			["left_data","up_data","right_data","down_data","space_data"].forEach(function(x){
				var i=new Image();
				i.src=opt.arrowImage[x]
				this.arrow_images[x]=i;
			},this);
		}else if(opt.arrowType=="grayimage"){
			this.arrow_images={};
			this.arrow_raw_images={};
			["left_data","up_data","right_data","down_data","space_data"].forEach(function(x){
				var i=new Image();
				this.arrow_raw_images[x]=i;
				
				this.arrow_images[x]=i;	//一時的
				
				i.onload=(function(){
					//arrow_imagesにはcanvasを入れる
					var ca=this.canvas.ownerDocument.createElement("canvas");
					ca.width=i.naturalWidth;
					ca.height=i.naturalHeight;
					var cx=ca.getContext('2d');
					cx.drawImage(i,0,0);
				}).bind(this);
				
				i.src=opt.arrowImage[x]
			},this);
		}
	},
	//オーディオを読み込み
	loadAudio:function(uri){
		if(this.header.mediaType=="video"){
			//ビデオ
			this.audio=document.createElement("video");
		}else{
			this.audio=new Audio();
			if(this.header.mediaType=="audioWithImage"){
				//静止画像が必要
				this.image=document.createElement("image");
				this.image.src=this.header.mediaImageURI;
			}
		}
		this.audio.preload="auto";
		this.audio.autoplay=true;
		this.audio.src=uri;
	},
	//infoオブジェクトをもとに書き込み ox,oy: もとの位置からのずれ
	writebi:function(ctx,info,str,ox,oy){
		ctx.font=info.font;
		if(info.color)ctx.fillStyle=info.color;
		ctx.fillText(str,info.x + (ox?ox:0),info.y+(oy?oy:0));
	},
	//メイン
	main:function(){
		var ctx=this.ctx,h=this.header;
		var n=Date.now();
		this.fps=1000/(n-this.check);	//fpsを測定
		this.check=n;
		
		ctx.fillStyle=this.header.color.background;
		ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
		var act=this.processes[this.processes.length-1];
		if(act && act.main)act.main();
	},
	//キー押した
	keydown:function(e){
		var c=e.keyCode,h=this.header;
		var act=this.processes[this.processes.length-1];
		if(act && act.kd){
			var ret=act.kd(e);
			if(ret===false){
				//終了
				act.kd=null;
			}
		}
	},
	//キー上げた
	keyup:function(e){
		var act=this.processes[this.processes.length-1];
		if(act && act.ku){
			var ret=act.ku(e);
			if(ret===false){
				//終了
				act.ku=null;
			}
		}
	},
	//譜面ロード
	loadHumen:function(obj){
		var coms=[];	//コマンド一覧
		["left_data","down_data","up_data","right_data","space_data"].forEach(function(x){
			coms=coms.concat(obj[x].map(function(y){
				return {type:x, frame:y};
			}));
		},this);
		var frzcnvs={	//対応する通常矢印のアレ
			"frzLeft_data":"left_data",
			"frzDown_data":"down_data",
			"frzUp_data":"up_data",
			"frzRight_data":"right_data",
			"frzSpace_data":"space_data",
		};

		["frzLeft_data","frzDown_data","frzUp_data","frzRight_data","frzSpace_data"].forEach(function(x){
			coms=coms.concat(obj[x].map(function(y){
				return {type:frzcnvs[x], frame:y.Start, end:y.End,freeze:true,hit:false};
			}));
		},this);
		coms=coms.concat(obj.speed_change.map(function(y){
			return {type:"speed_change", frame:y.frame, speed:y.speed};
		}));
		coms=coms.concat(obj.color_data.map(function(y){
			return {type:"color_data",frame:y.frame,setcolor:y["set"],color:y.color};
		}));
		//時間ごとソート（降順）
		coms.sort(function(a,b){
			return a.frame-b.frame;
		});
		return coms;
	},
	charString:function(num){
		if(num==37){
			return "Left"
		}else if(num==38){
			return "Up";
		}else if(num==39){
			return "Right";
		}else if(num==40){
			return "Down";
		}else if(num==32){
			return "Space";
		}
		return String.fromCharCode(num);
	},
	drawArrow:function(ctx,x,y,arrowname){
		//矢印を描画
		var h=this.header;
		if(h.arrowType=="image" || h.arrowType=="grayimage"){
			var img=this.arrow_images[arrowname];
			ctx.drawImage(img,x,y-img.height);
		}else{
			ctx.fillText(h.chars[arrowname],x,y);
		}
	},
	//コマンド
	commands:{
		//ローディングを司る
		loading:function(process){
			var g=process.game;
			var au=g.audio,ctx=g.ctx, h=g.header;
			
			var background= h.mediaType=="video" ? au : g.image;	//背景の
			process.mainer(function(){
				//音楽ロード中
				ctx.fillStyle=h.color.color;	//文字色
				ctx.font=h.font.normal;
				ctx.fillText("Loading...",50,50);
				
				if(au && au.error){
					//エラーメッセージのプロセス
					g.startProcess(g.commands.error,{message:"音楽にエラーが発生しました("+au.error.code+")"});
					process.die();
				}else if(au && au.readyState>=3){
					//十分読み込めただろう
					au.pause();
					au.currentTime=0;
					if(h.mediaType=="video" || h.mediaType=="audioWithImage"){
						//ビデオ・画像の位置を調整
						var div=document.createElement("div");
						div.style.position="relative";
						div.style.left="0px",div.style.top="0px";
						var c=g.canvas;
						c.parentNode.replaceChild(div,c);
						div.appendChild(c);
						c.style.position="relative";
						c.style.left="0px",c.style.top="0px";
						c.style.zIndex="1000";
						
						div.appendChild(background);
						background.style.position="absolute";
						background.style.left="0px", au.style.top="0px";
						background.style.zIndex="1";
						
						//ビデオの大きさ調整
						var aspect= h.mediaType=="video" ? background.videoWidth/background.videoHeight : background.naturalWidth/background.naturalHeight;
						if(isFinite(aspect)){
							//ビデオの大きさちゃんとある
							var cas=c.width/c.height;
							if(cas>=aspect){
								//キャンバスのほうが横長
								background.width=c.height*aspect;
								background.height=c.height;
							}else{
								background.width=c.width;
								background.height=c.width/aspect;
							}
						}
					}
					g.startProcess(g.commands.title);
					process.die();
				}
			});
		},
		error:function(process,opt){
			if(!opt)return;
			var g=process.game;
			var ctx=g.ctx, h=g.header;
			process.mainer(function(){
				//エラー
				ctx.fillStyle=h.color.error;	//文字色
				ctx.font=h.font.normal;
				ctx.fillText(opt.message,50,50);
			});
		},
		title:function(process){
			//タイトル
			var g=process.game;
			var ctx=g.ctx, h=g.header, k=g.keys;
			var index=0;	//選択
			
			process.mainer(function(){
				g.writebi(ctx,h.fontinfo.musictitle.title,h.musicTitle.title);
				g.writebi(ctx,h.fontinfo.musictitle.author,h.musicTitle.author);
				//難易度一覧
				g.modes.forEach(function(x,i){
					g.writebi(ctx,i==index?h.fontinfo.musictitle.mode_selected:h.fontinfo.musictitle.mode,x.name,0,i*60);
				});
				//その他
				g.writebi(ctx,index==-1? h.fontinfo.keyconfig.selected : h.fontinfo.keyconfig.normal, "Key config");
				g.writebi(ctx,index==-2? h.fontinfo.config.selected : h.fontinfo.config.normal, "Config");
				
				//設計
				if(index>=0){
					g.writebi(ctx,h.fontinfo.musictitle.mode_desc,"[←↓↑→] to select / Press [Space] to start");
				}else{
					g.writebi(ctx,h.fontinfo.musictitle.mode_desc,"[←↓↑→] to select / Press [Space] to enter");
				}
			});
			process.keydown(function(e){
				var c=e.keyCode;
				if(c==k.up_data || c==38){
					//↑
					if(index>=0){
						index=Math.max(0,index-1);
					}else{
						index=Math.min(-1,index+1);
					}
				}else if(c==k.down_data || c==40){
					//↓
					if(index>=0){
						index=Math.min(index+1,g.modes.length-1);
					}else{
						index=Math.max(-2,index-1);
					}
				}else if(c==k.left_data || c==37 || c==k.right_data || c==39){
					//←→
					if(index>=0)index=-1;
					else index=0;
				}else if(c==k.space_data || c==32){
					//Space
					if(index==-1){
						//Key Config
						//上乗せでkeyConfigを開く
						g.startProcess(g.commands.keyconfig);
					}else if(index==-2){
						//Config
						g.startProcess(g.commands.config);
					}else{
						g.startProcess(g.commands.game,{modeindex:index});
					}
				}else{
					return;
				}
				e.preventDefault();
			});
		},
		keyconfig:function(process){
			var g=process.game;
			var ctx=g.ctx, h=g.header;
			var index=0;	//キー選択
			
			var arrow_images;
			if(h.arrowType=="image"){
				arrow_images=g.arrow_images;
			}else if(h.arrowType=="grauimage"){
				arrow_images=g.arrow_raw_images;
			}
			
			process.mainer(function(){
				//キーコンフィグ
				//矢印描画
				["left_data","down_data","up_data","right_data","space_data"].forEach(function(x,i){
					ctx.fillStyle=h.color.arrow[x];	//hard coding
					ctx.font=h.font[x];
					if(index==i)ctx.fillStyle="#ff4444";	//hard coding
					
					g.drawArrow(ctx,h.pos[x],h.arrowy,x);
					ctx.font=h.font.normal;
					ctx.fillText(g.charString(g.keys[x]),h.pos[x]+5,h.arrowy+40);	//hard coding
				});
				g.writebi(ctx,h.fontinfo.keyconfig.message,"Escキーを押すと終了します");
			});
			process.keydown(function(e){
				var c=e.keyCode;
				e.preventDefault();
				if(c==27){
					//Esc
					localStorage.keys=JSON.stringify(g.keys);
					process.die();
					return;
				}
				var arr=["left_data","down_data","up_data","right_data","space_data"];
				g.keys[arr[index]]=c;
				index++;
				if(index>=arr.length)index=0;

			});
		},
		config:function(process){
			var g=process.game;
			var ctx=g.ctx, h=g.header;
			var index=0;	//情報選択
			var confs=[
				{name:"Reverse",values:["off","on"]},
				{name:"Speed",values:["x0.5","x1","x1.25","x1.5","x2","x2.5","x3","x4","x5","x7","x10"]},
				{name:"Correction",values:["-7","-6","-5","-4","-3","-2","-1","0","+1","+2","+3","+4","+5","+6","+7"]},

			];
			
			process.mainer(function(){
				//キーコンフィグ
				//矢印描画
				confs.forEach(function(x,i){
					var px=80, py=80+30*i;
					ctx.fillStyle=h.color.color;
					ctx.font=h.font.normal;
					if(index==i)ctx.fillStyle="#ff4444";	//hard coding
					ctx.fillText(x.name,px,py);

					ctx.fillText(g.config[x.name],px+150,py);	//hard coding
				},this);
				g.writebi(ctx,h.fontinfo.keyconfig.message,"[Space][←][→]:変更　[Esc]:終了");
			});
			process.keydown(function(e){
				var c=e.keyCode;
				if(c==27){
					//Esc
					process.die();
					return;
				}
				if(c==38){
					index--;
					if(index<0)index=0;
				}else if(c==40){
					index++;
					if(index>confs.length)index--;
				}else if(c==32 || c==37 || c==39){
					//変更
					var name=confs[index].name;
					var vi=confs[index].values.indexOf(g.config[name]);
					if(c==32 || c==39){
						vi++;
					}else{
						vi--;
					}
					if(vi>=confs[index].values.length){
						vi=0;
					}
					if(vi<0)vi=confs[index].values.length-1;
					g.config[name]=confs[index].values[vi];
				}else{
					return;
				}
				localStorage.HTML5Step_config=JSON.stringify(g.config);
				e.preventDefault();

			});
		},
		game:function(process,opt){
			//opt.modeindex: モード番号
			var g=process.game;
			var ctx=g.ctx, h=g.header, au=g.audio, k=g.keys, config=g.config;
			
			var background= h.mediaType=="video" ? au :
			                h.mediaType=="audioWithImage" ? g.image : null;
			//難易度モード設定
			var dobj=g.modes[opt.modeindex];
			if(!dobj)return;
			//var a=document.getElementById("a");
			
			var difStep=dobj.difStep;
			var speed=dobj.speedlock;
			var coms;
			var score={
				great:0,
				good:0,
				bad:0,
				miss:0,
				freezegood:0,
				freezebad:0,
			};
			au.currentTime=0;
			var normapoint=h.norma.init;	//最初
			var starting=Infinity;	//ゲーム開始時刻
			
			var pf_score=0;	//パーフェクトのときのスコアを計算しておく
			
			//矢印の幅
			var arrowwidths={};
			["left_data","up_data","right_data","down_data"].forEach(function(x){
				if(h.arrowType=="image"){
					arrowwidths[x]=g.arrow_images[x].naturalWidth;
				}else if(h.arrowType=="grayimage"){
					arrowwidths[x]=g.arrow_raw_images[x].naturalWidth;
				}else{
					ctx.font=h.font[x];
					arrowwidths[x]=ctx.measureText(h.chars[x]).width;
				}
			});
			
			//矢印位置について
			var arrowy=h.arrowy;	//矢印位置
			if(config.Reverse=="on"){
				arrowy=g.canvas.height-arrowy+30;	//hard coding
			}
			setArrowImage();
			
			//倍速設定
			var flow_speed=1;
			var result;
			if(result=config.Speed.match(/^x(\d+(?:\.\d+)?)/)){
				flow_speed=parseFloat(result[1]);
			}
			//Correction
			var coll_sut = parseInt(config.Correction);	//キー入力のずれ
			//エフェクト
			var effects=[];
			g.loadFile(dobj.uri,function(humen){
				coms=g.loadHumen(JSON.parse(humen));	//譜面読みこみ
				
				//スコア計算
				pf_score=0;
				for(var i=0,l=coms.length;i<l;i++){
					var c=coms[i];
					if(c.type!="speed_change" && c.type!="color_data"){
						//叩く
						if(c.freeze){
							pf_score+=h.scorevalue.freezegood;
						}else{
							pf_score+=h.scorevalue.great;
						}
					}
				}
				starting=Date.now()+1600;	//hard coding
			}.bind(this));
			process.mainer(function(){
				//ゲーム中
				if(background){
					//ビデオを表示する
					ctx.clearRect(0,0,background.width,background.height);
				}
				//2.0 [s] = Speedlock * (通過時間)[s]
				//var sp=	g.canvas.height/speed/h.fps;//矢印の速度  height[px]/(speed[s]・fps[f/s])=[px/f]
				var sp=g.canvas.height/((2/speed)*h.fps)	//height[px]/((2.0/speed)[s]・fps[f/s])
				var nowf=au.currentTime*h.fps;	//現在のフレーム
				if(isFinite(starting)){
					var _now;
					console.log(_now,starting);
					if((_now=Date.now())>=starting){
						g.audio.play();
						starting=Number.NaN;
					}else{
						nowf=(_now-starting)/1000*h.fps;
					}
				}
				if(au.ended){
					//終了した
					process.die();
					g.startProcess(g.commands.over,{score:score,pf_score:pf_score});
				}
				
				//var maxf=nowf+speed*h.fps;	//画面に表示される限界の[f]
				var maxf=nowf+g.canvas.height/sp/flow_speed;
				//a.textContent=nowf;
				ctx.save();
				ctx.globalAlpha=0.6;
				["left_data","up_data","right_data","down_data","space_data"].forEach(function(x){
					ctx.fillStyle=h.color.arrow[x];
					ctx.font=h.font[x];
					//ctx.fillText(h.chars[x],h.pos[x],arrowy);
					g.drawArrow(ctx,h.pos[x],arrowy,x);
				});
				ctx.restore();
		
				for(var i=0,l=coms.length;i<l;i++){
					//矢印ひとつひとつ
					var c=coms[i];
					if((c.freeze?c.end:c.frame)<nowf-h.trashrange){
						coms.splice(i,1);
						i--,l--;
						getscore(c.freeze ? "freezebad" : "miss");
						continue;
					}
					if(c.frame<nowf){
						if(c.type=="speed_change"){
							//speed change
							speed=c.speed;	//スピード変更
							coms.splice(i,1);
							i--,l--;
						}else if(c.type=="color_data"){
							//色変更
							switch(c.setcolor){
							case 0: h.color.arrow["left_data"]=c.color;break;
							case 2: h.color.arrow["down_data"]=c.color;break;
							case 3: h.color.arrow["space_data"]=c.color;break;
							case 4: h.color.arrow["up_data"]=c.color;break;
							case 6: h.color.arrow["right_data"]=c.color;break;
							
							case 36: h.color.freezearrow["space_data"]=c.color;break;
							case 37: h.color.freezeband["space_data"]=c.color;break;
							case 46: h.color.freezehitarrow["space_data"]=c.color;break;
							case 47: h.color.freezehitband["space_data"]=c.color;break;
							case 53: h.color.freezearrow["space_data"]=h.color.freezeband["space_data"]=c.color;break;
							case 58: h.color.freezehitarrow["space_data"]=h.color.freezehitband["space_data"]=c.color;break;
							
							default:	//一括系
								var pa=({
									20:[h.color.arrow],
									30:[h.color.freezearrow],
									31:[h.color.freezeband],
									40:[h.color.freezehitarrow],
									41:[h.color.freezehitband],
									50:[h.color.arrow,h.color.freezearrow],
									
									100:[h.color.arrow],
								})[c.setcolor];
								
								var datas=["left_data","down_data","up_data","right_data"];
								
								if(c.setcolor==100){
									datas[4]="space_data";
								}
								
								datas.forEach(function(x){
									pa.forEach(function(y){
										y[x]=c.color;
									});
								});
								break;
							}
							if(h.arrowType=="grayimage")setArrowImage();
							coms.splice(i,1);
							i--,l--;
						}
					}
					if(c.freeze && c.hit && c.end<=nowf){
						// 突破したのでOK
						getscore("freezegood");
						effects.push(new ScoreEffect(h.pos[c.type],h.arrowy,"freezegood"));
						coms.splice(i,1);
						i--,l--;
					}
					if(maxf<c.frame)break;	//sortされてるし
					if(!h.chars[c.type])continue;
					var spp= config.Reverse=="on" ? -sp : sp;	//反転処理
					spp *= flow_speed;	//スピード処理も
					ctx.font=h.font[c.type];
					if(c.freeze){
						//フリーズアロー！
						if(c.hit){
							ctx.fillStyle=h.color.freezehitband[c.type];	//帯
						}else{
							ctx.fillStyle=h.color.freezeband[c.type];	//帯
						}
						ctx.fillRect(h.pos[c.type],arrowy+(c.frame-nowf)*spp-20,arrowwidths[c.type],(c.end-c.frame)*spp+20);	//hard coding
						if(c.hit){
							ctx.fillStyle=h.color.freezehitarrow[c.type];
						}else{
							ctx.fillStyle=h.color.freezearrow[c.type];
						}
						g.drawArrow(ctx,h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp,c.type);
						//ctx.fillText(h.chars[c.type],h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp);
						g.drawArrow(ctx,h.pos[c.type] || 0,arrowy+(c.end-nowf)*spp,c.type);
						//ctx.fillText(h.chars[c.type],h.pos[c.type] || 0,arrowy+(c.end-nowf)*spp);
					}else{
						ctx.fillStyle=h.color.arrow[c.type];
						//console.log(h.color.arrow[c.type]);
						//ctx.fillText(h.chars[c.type] || "undef",h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp);
						g.drawArrow(ctx,h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp,c.type);
					}
				}
				//スコア
				ctx.font=h.font.score;
				var i=0;
				for(var x in score){
					//g.writebi(ctx,h.fontinfo.score[x],h.scorename[x]+" "+score[x]);
					ctx.fillStyle=h.color.score[x];
					//hard coding
					ctx.fillText(h.scorename[x]+" "+score[x],h.infox,80+i*25);
					i++;
				}
				if(h.timeinfo){
					//時間
					ctx.fillStyle=h.color.color;
					ctx.fillText(timeString(au.currentTime)+" / "+timeString(au.duration),h.infox,240);
				}
				//エッフェクト
				for(var i=0,l=effects.length;i<l;i++){
					var e=effects[i];
					e.main();
					if(!e.alive){
						effects.splice(i,1);
						i--,l--;
						continue;
					}
				}
				//ノルマバー
				//中
				ctx.save();
				ctx.globalAlpha=h.color.gauge.alpha;
				var height=normapoint/h.norma.max*h.gaugepos.height;
				ctx.fillStyle=normapoint>=h.norma.clear ? h.color.gauge.above : h.color.gauge.below;
				ctx.fillRect(h.gaugepos.x,h.gaugepos.y+h.gaugepos.height-height,h.gaugepos.width,height);
				
				//枠
				ctx.strokeStyle=h.color.gauge.frame;
				ctx.beginPath();
				ctx.moveTo(h.gaugepos.x,h.gaugepos.y);
				ctx.lineTo(h.gaugepos.x+h.gaugepos.width,h.gaugepos.y);
				ctx.lineTo(h.gaugepos.x+h.gaugepos.width,h.gaugepos.y+h.gaugepos.height);
				ctx.lineTo(h.gaugepos.x,h.gaugepos.y+h.gaugepos.height);
				ctx.closePath();
				ctx.lineWidth=h.gaugepos.framewidth;
				ctx.stroke();
				ctx.restore();
			});
			process.keydown(function(e){
				var c=e.keyCode;
				e.preventDefault();
				var nowf=au.currentTime*h.fps-coll_sut;	//現在のフレーム
				//hard coding
				for(var i=0,l=coms.length;i<l;i++){
					var co=coms[i];
					if(co.frame<nowf-8)continue;
					if(nowf+8<co.frame)break;
					if(c==k[co.type]){
						//押した
						var sa=Math.abs(nowf-co.frame);
						var sc="";
						if(sa<=2){
							sc="great";
						}else if(sa<=5){
							sc="good";
						}else{
							sc="bad";
						}
						if(co.freeze && sa<=5){
							//フリーズアローだった
							co.hit=true;
							var func=(function(c,co){
								var callee=function(e){
									if(e.keyCode==c){
										//キーを上げた
										var nowf=au.currentTime*h.fps;	//現在のフレーム
										var sc;
										for(var i=0,l=coms.length;i<l;i++){
											if(coms[i]==co){
												//消す
												coms.splice(i,1);
												if(co.end-5<=nowf){
													//OK
													sc="freezegood";
												}else{
													sc="freezebad";
												}
												getscore(sc);
												effects.push(new ScoreEffect(h.pos[co.type],h.arrowy,sc));
												break;
											}
										}
										document.removeEventListener('keyup',callee,false);
									}
								};
								return callee;
							})(c,co);
							document.addEventListener('keyup',func,false);
						}else if(!co.freeze){
							getscore(sc);
							effects.push(new ScoreEffect(h.pos[co.type],h.arrowy,sc));
							coms.splice(i,1);
							i--,l--;
						}
						break;
					}
				}
			});
			function Effect(x,y){
				this.alive=true;
				this.x=x,this.y=y;
			}
			Effect.prototype={
				main:function(){
				},
			};
			function ScoreEffect(x,y,score){
				Effect.apply(this,arguments);
				this.op=1;
				this.score=score;
			}
			ScoreEffect.prototype.main=function(){
				this.y-=120/g.fps;
				this.op-=1.2/g.fps;	//1.2[point/s]
				if(this.op<=0){
					this.alive=false;
					return;
				}
				//描画
				ctx.save();
				ctx.fillStyle=h.color.score[this.score];
				ctx.globalAlpha=this.op;
				ctx.fillText(h.scorename[this.score],this.x,this.y);
				ctx.restore();
			};
			
			function getscore(scorename){
				score[scorename]++;
				normapoint+=h.norma.score[scorename];
				if(normapoint>h.norma.max)normapoint=h.norma.max;
				if(normapoint<0)normapoint=0;
				
				//終了判定など
				if(normapoint<=h.norma.fail){
					//途中でダメになった
					au.pause();
					process.die();
					g.startProcess(g.commands.over,{score:score,pf_score:pf_score,fail:true});
				}
			}
			//grayimage用
			function setArrowImage(){
				if(h.arrowType!="grayimage")return;
				["left_data","down_data","up_data","right_data","space_data"].forEach(function(n){
					//h.color.arrow
					var c=g.arrow_images[n];
					if(!c.getContext){
						c=g.arrow_images[n]=g.arrow_raw_images[n].ownerDocument.createElement("canvas");
						c.width=g.arrow_raw_images[n].naturalWidth;
						c.height=g.arrow_raw_images[n].naturalHeight;
					}
					var cx=c.getContext('2d');
					//矢印のキャンバス
					cx.drawImage(g.arrow_raw_images[n],0,0);
					var data=cx.getImageData(0,0,c.width,c.height);

					var color={r:0,g:0,b:0};
					cx.fillStyle=h.color.arrow[n];
					var st=cx.fillStyle;
					var result;
					//serialization of a color
					if(result=st.match(/^#([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])$/)){
						color.r=parseInt(result[1],16);
						color.g=parseInt(result[2],16);
						color.b=parseInt(result[3],16);
						
					}else if(result=st.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*0\.\d+\)$/)){
						color.r=parseInt(result[1]);
						color.g=parseInt(result[2]);
						color.b=parseInt(result[3]);
					}
					console.log(color);
					
					var w=data.width, he=data.height;
					
					var output=cx.createImageData(data);
					
					var dd=data.data, od=output.data;
					
					color.r=color.r/255, color.g=color.g/255, color.b=color.b/255;
					for(var x=0;x<w;x++){
						for(var y=0;y<he;y++){
							var i=(y*w+x)*4;
							if(dd[i+3]>0){
								if(dd[i]==dd[i+1] && dd[i+1]==dd[i+2]){
									//グレー
									od[i]=dd[i]*color.r|0;
									od[i+1]=dd[i]*color.g|0;
									od[i+2]=dd[i]*color.b|0;
									od[i+3]=dd[i+3];
									//console.log(n,x,y,":",od[i],od[i+1],od[i+2]);
								}
							}else{
								od[i]=dd[i];
								od[i+1]=dd[i+1];
								od[i+2]=dd[i+2];
								od[i+3]=dd[i+3];
							}
						}
					}
					cx.putImageData(output,0,0);
					
					
				});
			}
			//秒数をmm:ss型にする
			function timeString(sec){
				var m=Math.floor(sec/60);
				return m+":"+("0"+(Math.floor(sec)%60)).slice(-2);
			}

		},
		over:function(process,opt){
			var g=process.game;
			var ctx=g.ctx, h=g.header, au=g.audio, k=g.keys;
			var score=opt.score;
			//ランクを計算
			var scorepoint=0;
			["great","good","bad","miss","freezegood","freezebad"].forEach(function(x){
				scorepoint+=h.scorevalue[x]*score[x];
			});
			//割合
			
			var rate=scorepoint/opt.pf_score*100;
			var rank, rank_border=-1;	//ランク
			for(var rankname in h.rankstr){
				if(rate>h.rankstr[rankname] && h.rankstr[rankname]>rank_border){
					//もっと上の
					rank=rankname;
					rank_border=h.rankstr[rankname];
				}
			}
			//特殊
			if(rate<100 && score.miss==0 && score.freezebad==0){
				rank=h.rankspecial.fullcomplete;
			}
			if(opt.fail){
				rank=h.rankspecial.fail;
			}
			console.log(rate,rank);
			process.mainer(function(){
				//ランク表示
				g.writebi(ctx,h.fontinfo.rank,rank);
				//スコア
				ctx.font=h.font.score;
				var i=0;
				for(var x in score){
					//g.writebi(ctx,h.fontinfo.score[x],h.scorename[x]+" "+score[x]);
					ctx.fillStyle=h.color.score[x];
					//hard coding
					ctx.fillText(h.scorename[x]+" "+score[x],h.infox,80+i*25);
					i++;
				}
				//次へ
				g.writebi(ctx,h.fontinfo.musictitle.mode_desc,"Press any key to retry");
			});
			setTimeout(function(){
				process.keydown(function(e){
					//キー押したら終了
					process.die();
					e.preventDefault();
				});
			},1000);	//hard coding
		},
	},
};
function Process(game){
	this.game=game;
	this.main=null;
	this.kd=null,this.ku=null;
	this.op=null;
};
Process.prototype={
	die:function(){
		this.game.processes=this.game.processes.filter(function(x){return x!=this},this);
		var act=this.game.processes[this.game.processes.length-1];
		if(act && act.op)act.op(false);	//ポーズでない
	},
	mainer:function(func){
		this.main=func;
	},
	//falseを返すと終了
	keydown:function(func){
		this.kd=func;
	},
	keyup:function(func){
		this.kd=func;
	},
	onpause:function(func){
		this.op=func;
	},
};
