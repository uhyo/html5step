//ゲーム初期化?
function Onigiri(headerfile){
	this.game=null;
	this.headerfile=headerfile || "header.json";
}
Onigiri.prototype={
	init:function(viewcallback){
		var game=this.game=new Game();
		var t=this;
		
		game.useUser(Game.DOMUser,function(user){
			//キー情報をlocalStorageから引っ張る
			user.keys= localStorage.keys ? JSON.parse(localStorage.keys) : {
				left_data:37,
				up_data:38,
				right_data:39,
				down_data:40,
				space_data:32,
			};

			//キー入力をユーザーへ流す
			user.capture=capture;
			var standardUnCapture;
			//デフォルトの入力イベント有効化
			user.useStandardKeyCapture=function(){
				if(standardUnCapture){
					standardUnCapture();
					standardUnCapture=null;
				}
				standardUnCapture=this.capture(standardCapture);
			};
			//無効化
			user.unuseStandardKeyCapture=function(){
				if(standardUnCapture)standardUnCapture();
				standardUnCapture=null;
			};
			user.useStandardKeyCapture();
			//標準のキーストリームを有効化/無効化
			function standardCapture(direction,keyCode){
				user.event.emit("keydown",direction,keyCode);
			}

			//方向情報付き入力補足メソッド(uncaptureを返す)
			function capture(eventname,callback){
				//eventname:省略可能("eventname")
				if("function"===typeof eventname){
					callback=eventname;
					eventname="keydown";
				}else if(!eventname){
					eventname="keydown";
				}
				//this=user
				this.addEventListener(eventname,handler,false);
				return function uncapture(){
					this.removeEventListener(eventname,handler,false);
				}.bind(this);
				function handler(e){
					//方向情報をアレする
					var c=e.keyCode, k=user.keys;
					var direction= c===k.left_data || c===37? "left" :
						c===k.up_data || c===38? "up" :
						c===k.right_data || c===39? "right" :
						c===k.down_data || c===40? "down" :
						c===k.space_data || c===32? "space" : "";

					//user.event.emit("keydown",direction,e.keyCode);
					callback(direction,e.keyCode);
					e.preventDefault();
				}
			}
		});
		//ゲームの初期化
		game.event.on("gamestart",function(){
			var host=game.add(OnigiriHost);
			//host.event.emit("loadHeader","header.json");
			game.readFile(t.headerfile,function(data){
				var j=JSON.parse(data);	//ヘッダーを読み込んだ
				host.event.emit("loadHeader",j);
			});
			//ユーザー出現
			game.event.on("entry",function(user){
				host.useHeader(function(h){
					if(host.state!==host.STATE_PREPARING){
						//観戦枠
						return;
					}
					var panel=game.add(PlayerPanel,{
						host:host,
						user:user,
					});
					if(host.users.length<h.maxPlayers){
						//まだ入る枠がある
						host.event.emit("addPlayer",panel);
						panel.openPanel(game,"title");
					}else{
						//観戦枠
					}
				});
			});
		});
		game.init(Game.ClientDOMView,viewcallback);
		game.start();
	},
};
//Onigiri Host
function OnigiriHost(game,event,param){
	this.header=null;	//loadしたらオブジェクト
	this.users=[];	//PlayerPanel
	this.mediaTimer=game.getTimer();
	this.state=this.STATE_PREPARING;
	//no transfer!
	Object.defineProperty(this,"_loadHeaderCallbacks",{
		value:[],
		configurable:true,
		enumerable:false,
		writable:false,
	});
}
OnigiriHost.prototype={
	//game state
	STATE_PREPARING:0,	//preparing
	STATE_PLAYING:1,	//playing
	STATE_RESULT:2,		//result
	init:function(game,event,param){
		var t=this;
		event.on("loadHeader",function(h){
			t.setHeader(h);
		});
		//プレイヤー追加
		event.on("addPlayer",function(panel){
			t.users.push(panel);
		});
		//準備ができた
		event.on("ready",function(panel){
			//全て準備ができたかどうか確認する
			var h=t.header;
			var minNumber= game.env==="standalone" ? 1 : h.minPlayers || 1;	//対戦最小人数
			if(t.users.length>=minNumber && t.users.every(function(p){return p.ready})){
				//スタートだ!!
				t.mediaTimer.clean();
				t.mediaTimer.setTime(-1600);
				t.state=t.STATE_PLAYING;	//プレイ中
				event.emit("start");
			}
		});
		//終了した
		event.on("ended",function(panel){
			console.log("ended5",t.users.indexOf(panel));
			//全て終了したどうか確認する
			if(t.users.every(function(p){return p.ended})){
				//終了した。結果を知らせる
				console.log("ended6");
				t.state=t.STATE_RESULT;
				event.emit("endgame");	//ゲーム終了
				t.users.forEach(function(x){
					//x.event.emit("showResult");
					x.showResult(game);
				});
			}
		});
		//戻った
		event.on("back",function(panel){
			if(t.users.every(function(p){return p.back})){
				//終了した。結果を知らせる
				t.state=t.STATE_PREPARING;
				//いない人は除く
				t.users=t.users.filter(function(x){return !x.gone});
				t.users.forEach(function(x){
					x.event.emit("initState");
					x.openPanel(game,"title");
				});
			}
		});
		//いなくなった
		event.on("bye",function(panel){
			//いない状態にする
			if(t.state===t.STATE_PREPARING){
				//いないぞ!
				t.users=t.users.filter(function(x){return x!==panel});
			}else{
				panel.openPanel(game,"gone");
			}
		});
	},
	//--internal
	setHeader:function(h){
		var opt={};	//header object
		Object.getOwnPropertyNames(this.defaultHeader).forEach(function(x){
			opt[x]=this.defaultHeader[x];
		},this);
		Object.getOwnPropertyNames(h).forEach(function(x){
			if(h[x]!=null){
				Object.defineProperty(opt,x,Object.getOwnPropertyDescriptor(h,x));
			}
		});

		this.header=opt;
		//modeを配列に
		this.modes=Object.keys(opt.score).map(function(x){opt.score[x].name=x;return opt.score[x]});
		//ヘッダが取得できた
		this.event.emit("getHeader",opt);
		//コールバックを戻す
		this._loadHeaderCallbacks.forEach(function(cb){
			cb(opt);
		});
		this._loadHeaderCallbacks.length=0;

		//this.event.emit("loadAudio",opt.mediaURI);
		//矢印ロード
		//this.event.emit("loadArrows",opt.arrowType,opt.arrowImage);
	},
	//--render
	renderTop:true,
	renderInit:function(view,game){
		var t=this;
		var store=view.getStore();
		var div=document.createElement("div");
		//イベント
		//メディアをXHRで読み込む
		this.useHeader(function(h){
			var xhr=new XMLHttpRequest;
			var mediaLoading={};	//メディア情報を記録するオブジェクト
			mediaLoading.callbacks=[];	//コールバックを呼び出す
			xhr.responseType="blob";	//Blobで読み込む
			xhr.onload=function(e){
				var xhr=e.target;
				var urlobj = window.URL ? window.URL : window.webkitURL ? window.webkitURL : window.mozURL ? window.mozURL : window.oURL ? window.oURL : null;
				mediaLoading.blob=xhr.response;
				mediaLoading.bloburl=urlobj.createObjectURL(xhr.response);	//createObjectURLで作成した
				//貯めてあるコールバックを呼び出す
				mediaLoading.callbacks.forEach(function(f){
					f(mediaLoading);
				});
				mediaLoading.callbacks=[];
			};
			xhr.open("GET",h.mediaURI);
			xhr.send();
			//読み込む
			store.mediaLoading=mediaLoading;	//ストアに置いておく
			//メディアローディングユーティリティ
			mediaLoading.onload=function(callback){
				//既に読み込めていたら即座に呼び出す
				if(xhr.readyState===4){
					callback(this);
				}else{
					//貯める
					this.callbacks.push(callback);
				}
			};
			//ロード後メディア管理
			var mediaPlayer=store.mediaPlayer={};
			mediaPlayer.host=t, mediaPlayer.view=view;
			mediaPlayer.mediaLoading=mediaLoading;
			mediaPlayer.callbacks=[];
			mediaPlayer._getMediaController=function(){
				if(this.mediaController)return this.mediaController;
				if("undefined" !== typeof MediaController){
					return this.mediaController=new MediaController();
				}
				return null;
			};
			//オーディオ登録
			mediaPlayer.registerMedia=function(audio){
				var m=this._getMediaController();
				if(m){
					audio.controller=m;
				}
			};
			//オーディオ全てに
			mediaPlayer.forEachMedia=function(callback){
				var host=this.host;
				host.users.forEach(function(panel){
					var st=this.view.getStore(panel);
					callback(st.audio);
				},this);
			};
			mediaPlayer.mapMedia=function(callback){
				var host=this.host;
				host.users.map(function(panel){
					var st=this.view.getStore(panel);
					return callback(st.audio);
				},this);
			};
			mediaPlayer.filterMedia=function(callback){
				var host=this.host;
				return host.users.filter(function(panel){
					var st=this.view.getStore(panel);
					return callback(st.audio);
				},this);
			};
			mediaPlayer.everyMedia=function(callback){
				var host=this.host;
				return host.users.every(function(panel){
					var st=this.view.getStore(panel);
					return callback(st.audio);
				},this);
			};
			mediaPlayer.play=function(time){
				//演奏開始
				this.mediaLoading.onload(function(){
					this.oncanplaythrough(function(){
						var m=this._getMediaController();
						var tim;	//時間
						if("function"===typeof time){
							tim=time();
						}else{
							//数字だろう
							tim=time||0;
						}
						if(m){
							m.currentTime=tim;
							m.play();
						}else{
							//no controller!
						}
						//Mediaありなら必要ないはずだけど・・・
						this.forEachMedia(function(media){
							if(!m){
								media.currentTime=tim;
							}
							media.muted=false;
							media.play();
						});
					}.bind(this));
				}.bind(this));
			};
			//ポーズして戻す
			mediaPlayer.reset=function(){
				var m=this._getMediaController();
				if(m){
					m.pause();
					m.currentTime=0;
				}else{
					//no controller!
				}
				//Mediaありなら必要ないはずだけど・・・
				this.forEachMedia(function(media){
					if(!m){
						media.currentTime=0;
					}
					media.pause();
				});
			};
			//イベントを監視するやつ
			mediaPlayer._multi=function(eventname,mediaChecker,handler){
				if(this.everyMedia(mediaChecker)){	//mediaChecker:mediaを引数にとって条件満たすか調べる
					//既に読み込んでいる
					handler();
					return;
				}
				var m=this._getMediaController();
				if(m){
					//mapありなら・・・
					m.addEventListener(eventname,function h(e){
						handler();
						m.removeEventListener(eventname,h,false);
					},false);
				}else{
					//ないなら・・・
					var h=function(){
						if(this.everyMedia(mediaChecker)){
							//読み込めた
							handler();
							return;
						}
					}.bind(this);
					//全部を監視する
					this.forEachMedia(function(media){
						media.addEventListener(eventname,function ha(e){
							h();
							e.target.removeEventListener(eventname,ha,false);
						},false);
					});
				}
			};
			mediaPlayer.oncanplaythrough=function(callback){
				this._multi("canplaythrough",function(media){return media.readyState===4},callback);
			};
			//終了
			mediaPlayer.onended=function(callback){
				this._multi("ended",function(media){return media.ended},callback);
			};
			//自分は横2つ分の幅
			var widelength= game.env==="standalone" ? 1 : Math.min(h.maxPlayers,2) || 1;
			div.style.width=(h.canvas.x*widelength)+"px";
			//読み込めたらmediaReadyを報告する
			if(t.state===t.STATE_PLAYING){
				//すでに開始していたら追いつく
				store.mediaPlayer.play(function(){
					return t.mediaTimer.getTime()/1000;
				});
			}
			/*store.mediaPlayer.oncanplaythrough(function(){
				//自分のユーザーは報告する
				game.user.event.emit("mediaReady");
				store.mediaPlayer.onended(function(){
					//終了も報告する
					game.user.event.emit("mediaEnded");
				});
			});*/
		});
		//オーディオ読み込み指令
		this.event.on("start",function(){
			//タイムライン開始（オーディオ開始）
			var timer=t.mediaTimer;
			//時間までは止めておく
			store.mediaPlayer.reset();
			timer.addFunc(0,function(){
				//0になったらオーディオ開始
				store.mediaPlayer.play(0);
			});
		});
		//終了したら戻す
		this.event.on("endgame",function(){
			store.mediaPlayer.reset();
		});
		return div;
	},
	render:function(view){
		var d=view.getItem(), store=view.getStore(), h=this.header;
		//リソース読み込み
		if(!store.arrow_images && h){
			var arrow_images={}, arrow_raw_images={};
			var arrowImage=h.arrowImage;
			if(h.arrowType==="image"){
				["left_data","up_data","right_data","down_data","space_data"].forEach(function(x){
					var i=new Image();
					i.src=arrowImage[x];
					arrow_images[x]=i;
				},this);
				store.arrow_images=arrow_images;
			}else if(h.arrowType==="grayimage"){
				["left_data","up_data","right_data","down_data","space_data"].forEach(function(x){
					var i=new Image();
					arrow_raw_images[x]=i;

					arrow_images[x]=i;	//一時的

					i.onload=(function(){
						//arrow_imagesにはcanvasを入れる
						var ca=document.createElement("canvas");
						ca.width=i.naturalWidth;
						ca.height=i.naturalHeight;
						var cx=ca.getContext('2d');
						cx.drawImage(i,0,0);
						arrow_images[x]=cx;
					}).bind(this);

					i.src=arrowImage[x];
				},this);
				store.arrow_images=arrow_images;
				store.arrow_raw_images=arrow_raw_images;
			}
		}
		while(d.hasChildNodes())d.removeChild(d.firstChild);

		if(h){
			//子どもたちを入れる
			for(var i=0,l=this.users.length;i<l;i++){
				d.appendChild(view.render(this.users[i]));
			}
		}
	},
	//ヘッダを使う処理（遅延?）
	useHeader:function(cb){
		if(this.header){
			cb(this.header);
			return;
		}
		//this.event.once("getHeader",cb);
		this._loadHeaderCallbacks.push(cb);
	},
	//----- client
	//infoオブジェクトをもとに書き込み ox,oy: もとの位置からのずれ
	writebi:function(ctx,info,str,ox,oy){
		ctx.font=info.font;
		if(info.color)ctx.fillStyle=info.color;
		ctx.fillText(str,info.x + (ox?ox:0),info.y+(oy?oy:0));
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
	drawArrow:function(ctx,x,y,arrowname,arrow_images){
		//矢印を描画
		var h=this.header;
		if(h.arrowType=="image" || h.arrowType=="grayimage"){
			var img=arrow_images[arrowname];
			ctx.drawImage(img,x,y-img.height);
		}else{
			ctx.fillText(h.chars[arrowname],x,y);
		}
	},

	//default Header
	defaultHeader:{
		fps:60,	//60[frame/s] 変更非推奨（譜面が60fpsのため）
		renderfps:60,	//描画のフレームレート(requestAnimationFrame使えない場合)
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
				excellent:"#ffff00",
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
				excellent:5,
				great:3,
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
		//infox:380,
		infoarea:{
			//情報表示場所
			x:380,	//左端
			scorey:80,	//スコア表示の開始位置
			scoredeltay:25,	//スコア1つごとの移動距離
			scorepointy:250,	//合計スコア表示
			//時間表示
			timeinfo:true,//時間を表示するか
			timey: 280,
		},
		//スコア名前
		scorename:{
			excellent:"(ﾟ∀ﾟ)ｷﾀｰ!!",
			great:"（・∀・）ｲｲ!!",
			good:"(´∀｀)ﾏﾀｰﾘ",
			bad:"(´・ω・｀)ｼｮﾎﾞｰﾝ",
			miss:"ヽ(`Д´)ﾉｳﾜｧﾝ!!",
			freezegood:"(ﾟ∀ﾟ)ｷﾃﾏｽ!!",
			freezebad:"(・A・)ｷﾃﾅｲ",
		},
		//スコア数値換算
		scorevalue:{
			excellent:10,
			great:7,
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
		
		//矢印のタイプ
		arrowType:"char",	// char/image/grayimage
		arrowImage:{
			up_data:"images/arrow_up.png",
			right_data:"images/arrow_right.png",
			down_data:"images/arrow_down.png",
			left_data:"images/arrow_left.png",
			space_data:"images/arrow_space.png",
		},
		
		//オンラインsettings
		minPlayers:1,	//最小同時プレイ人数
		maxPlayers:2,	//最大同時プレイ人数
	},
};
//プレイヤーパネル
function PlayerPanel(game,event,param){
	this.host=param.host;	//OnigiriHost
	this.user=param.user;
	this.mediaReady=false;	//メディアの準備ができたかどうか
	this.ready=false;	//ゲーム開始準備ができたかどうか
	this.ended=false;	//演奏終了したかどうか
	this.back=false;	//戻りたいかどうか
	this.gone=false;	//既にいないかどうか
	//デフォルトコンフィグをセット
	var c=this.config={};
	this.host.useHeader(function(h){
		for(var key in h.defaultConfig){
			c[key]=h.defaultConfig[key];
		}
	});
}
PlayerPanel.prototype={
	init:function(game,event,param){
		var t=this, user=this.user;
		//初期状態
		event.on("initState",function(){
			t.ready=false;
			t.ended=false;
			t.back=false;
		});
		//パネル起動
		event.on("openPanel",function(panel){
			t.panel=panel;
		});
		//メディア準備
		user.event.on("mediaReady",function(){
			if(t.ready)return;	//もうreadyだ
			event.emit("mediaReady");
		});
		event.on("mediaReady",function(){
			t.mediaReady=true;
		});
		event.on("ready",function(){
			t.ready=true;
			t.host.event.emit("ready");
		});
		//メディア終了
		user.event.on("mediaEnded",function(){
			console.log("ended2");
			event.emit("mediaEnded");
		});
		event.on("mediaEnded",function(){
			console.log("ended3");
			t.ended=true;
			t.host.event.emit("ended",t);
		});
		//タイトルに戻りたい
		event.on("back",function(){
			t.back=true;
			t.host.event.emit("back",t);
		});

		//接続が切れた
		user.event.on("disconnect",function(){
			event.emit("bye");
		});
		event.on("bye",function(){
			t.gone=true;
			t.ended=true;
			t.back=true;
			t.host.event.emit("bye",t);
		});
	},
	renderInit:function(view){
		var t=this, host=this.host, h=host.header, store=view.getStore();
		//囲いのdiv
		var div=document.createElement("div");
		//canvasを作る
		var c=document.createElement("canvas");
		c.width=h.canvas.x, c.height=h.canvas.y;
		div.style.width=c.width+"px", div.style.height=c.height+"px";
		div.style.display="inline-block";	//横並びがいい
		store.canvas=c;
		//メディアスターと
		host.event.on("start",function(){
			//0になったらはじめる
			host.mediaTimer.addFunc(0,function(){
				//ほんとうはmediaController側で再生されるはずだけど・・・
				var meindex=host.users.indexOf(t);
				if(meindex===0){
					//自分が代表
					store.audio.muted=false;
				}else{
					store.audio.muted=true;
				}
				store.audio.play();
			});
		});
		host.event.on("endgame",function(){
			//止めておくぞ!
			store.audio.pause();
		});
		div.appendChild(c);
		return div;
	},
	render:function(view){
		var store=view.getStore(),host=this.host, h=host.header, hstore=view.getStore(host);
		var div=view.getItem();	//親
		var c=store.canvas;
		//メディア読み込み
		if(!store.audio && h){
			var au=h.mediaType==="video" ? document.createElement("video") : new Audio();
			if(h.mediaType==="video"){
				//ビデオ調整
				au.addEventListener("loadedmetadata",function handler(e){
					var aspect= au.videoWidth/au.videoHeight;
					if(isFinite(aspect)){
						//ビデオの大きさちゃんとある
						var cas=c.width/c.height;
						if(cas>=aspect){
							//キャンバスのほうが横長
							au.width=c.height*aspect;
							au.height=c.height;
						}else{
							au.width=c.width;
							au.height=c.width/aspect;
						}
						div.appendChild(au);
						div.style.position="relative";
						div.style.left="0px",div.style.top="0px";
						div.style.width=c.width+"px", div.style.height=c.height+"px";
						c.style.position="absolute";
						c.style.left="0px",c.style.top="0px";
						c.style.zIndex="1000";
						au.style.position="absolute";
						au.style.left="0px",au.style.top="0px";
						au.style.zIndex="1";
					}

					e.target.removeEventListener("loadedmetadata",handler,false);
				},false);
			}
			au.preload="auto";
			au.autoplay=true;	//自動読み込み有効にするため
			//au.src=h.mediaURI;
			hstore.mediaLoading.onload(function(m){
				au.src=m.bloburl;	//メディアをBlobから読み込む
			});
			au.muted=true;
			//プレイ時は止める
			au.addEventListener("play",function handler(e){
				au.pause();
				au.removeEventListener("play",handler,false);
			},false);
			au.play();
			store.audio=au;
			//コントローラーに登録
			var st2=view.getStore(this.host);
			//au.controller=st2.mediaController;
			st2.mediaPlayer.registerMedia(au);
			
			if(h.mediaType==="audioWithImage"){
				//静止画像が必要
				store.image=new Image();
				store.image.src=h.mediaImageURI;
			}
		}
		if(h){
			var ctx=c.getContext('2d');
			//まず真っ黒に塗る
			ctx.fillStyle=h.color.background;
			ctx.fillRect(0,0,c.width,c.height);

			if(this.panel){
				//パネルがある
				view.render(this.panel);	//初期化だけ・・・
				this.panel.renderCanvas(c,ctx,view);
			}
		}
	},
	//--internal
	openPanel:function(game,mode,option){
		game.internal(function(){
			if(this.panel){
				this.panel.event.emit("die");
			}
			var con;
			switch(mode){
				case "title":
					con=TitlePanel;
					break;
				case "keyconfig":
					con=KeyConfigPanel;
					break;
				case "config":
					con=ConfigPanel;
					break;
				case "game":
					con=GamePanel;
					break;
				case "result":
					con=ResultPanel;
					break;
				case "gone":
					con=GonePanel;
					break;
			}
			if(con){
				var panel=game.add(con,{
					user:this.user,
					parent:this,
					option:option,
				});
				this.event.emit("openPanel",panel);
			}
		}.bind(this));
	},
	showResult:function(game){
		//子のgamingpanelのresult表示
		if(this.panel instanceof GamePanel){
			this.panel.showResult(game);	//伝播するgame
		}
	},
	//------
	//デフォルト コンフィグ
	confs:[
		{name:"Reverse",values:["off","on"]},
		{name:"Speed",values:["x0.5","x1","x1.25","x1.5","x2","x2.5","x3","x4","x5","x7","x10"]},
		{name:"Correction",values:["-7","-6","-5","-4","-3","-2","-1","0","+1","+2","+3","+4","+5","+6","+7"]},
	],
};
//------プレイヤーパネルの子になる感じのやつ
function ChildPanel(game,event,param){
	this.parent=param.parent;
	this.user=param.user;
}
ChildPanel.prototype={
	renderInit:function(view,game){
		return document.createElement("div");
	},
	render:function(view){
		var h=this.parent.host.header;
		view.getItem();
		var c=view.getStore(this.parent).canvas;	//canvasを得る
		var ctx=c.getContext('2d');
		//まず真っ黒に塗る
		ctx.fillStyle=h.color.background;
		ctx.fillRect(0,0,c.width,c.height);
		this.renderCanvas(c,ctx,view);
	},
};
//タイトル
function TitlePanel(game,event,param){
	ChildPanel.apply(this,arguments);
	//モード選択のindex
	this.index=0;
}
TitlePanel.prototype=Game.util.extend(ChildPanel,{
	init:function(game,event,param){
		var t=this, user=this.user, host=this.parent.host;
		event.on("changeindex",function(index){
			t.index=index;
		});
		user.event.on("keydown",khandler);
		event.on("die",function(){
			user.event.removeListener("keydown",khandler);
		});

		function khandler(dir,c){
			if(dir==="space"){
				//Space
				if(t.index==-1){
					//Key Config
					t.parent.openPanel(game,"keyconfig");
				}else if(t.index==-2){
					//Config
					t.parent.openPanel(game,"config");
				}else{
					t.parent.openPanel(game,"game",{modeindex:t.index});
					//ゲームの準備をさせる
				}
				return;
			}else if(dir==="up"){
				//↑
				if(t.index>=0){
					t.index=Math.max(0,t.index-1);
				}else{
					t.index=Math.min(-1,t.index+1);
				}
			}else if(dir==="down"){
				//↓
				if(t.index>=0){
					t.index=Math.min(t.index+1,host.modes.length-1);
				}else{
					t.index=Math.max(-2,t.index-1);
				}
			}else if(dir==="left"||dir==="right"){
				//←→
				if(t.index>=0)t.index=-1;
				else t.index=0;
			}else{
				return;
			}
			t.event.emit("changeindex",t.index);
		}
	},
	renderCanvas:function(canvas,ctx,view){
		var host=this.parent.host, t=this;
		var h=host.header;
		if(!h)return;
		host.writebi(ctx,h.fontinfo.musictitle.title,h.musicTitle.title);
		host.writebi(ctx,h.fontinfo.musictitle.author,h.musicTitle.author);
		//難易度一覧
		host.modes.forEach(function(x,i){
			host.writebi(ctx,i==t.index?h.fontinfo.musictitle.mode_selected:h.fontinfo.musictitle.mode,x.name,0,i*60);
		});
		//その他
		host.writebi(ctx,t.index==-1? h.fontinfo.keyconfig.selected : h.fontinfo.keyconfig.normal, "Key config");
		host.writebi(ctx,t.index==-2? h.fontinfo.config.selected : h.fontinfo.config.normal, "Config");

		//設計
		if(t.index>=0){
			host.writebi(ctx,h.fontinfo.musictitle.mode_desc,"[←↓↑→] to select / Press [Space] to start");
		}else{
			host.writebi(ctx,h.fontinfo.musictitle.mode_desc,"[←↓↑→] to select / Press [Space] to enter");
		}
	},
});
function KeyConfigPanel(game,event,param){
	ChildPanel.apply(this,arguments);
	this.index=0;
}
KeyConfigPanel.prototype=Game.util.extend(ChildPanel,{
	init:function(game,event,param){
		var t=this;
		event.on("changeindex",function(index){
			t.index=index;
		});
		this.user.event.on("keydown",khandler);
		this.event.on("die",function(){
			t.user.event.removeListener("keydown",khandler);
		});
		function khandler(dir,c){
			if(c==27){
				//Esc
				//トップに戻る
				t.parent.openPanel(game,"title");
				return;
			}
			var arr=["left_data","down_data","up_data","right_data","space_data"];
			//t.user.keys[arr[t.index]]=c;
			event.emit("setKey",arr[t.index],c);
			t.index++;
			if(t.index>=arr.length)t.index=0;
			event.emit("changeindex",t.index);
		}
	},
	renderInit:function(view,game){
		//実際は描画しないけど初期化だけしちゃう系
		var t=this, k=this.user.keys, host=this.parent.host, ev=this.event;
		ev.on("setKey",function(keyname,charcode){
			//キー設定変更
			if(k){
				k[keyname]=charcode;
				localStorage.keys=JSON.stringify(k);
			}
		});
		return document.createElement("div");
	},
	renderCanvas:function(canvas,ctx,view){
		var host=this.parent.host, t=this;
		var h=host.header, st=view.getStore(host);	//hostのデータ
		if(!h)return;
		var arrow_images;
		if(h.arrowType=="image"){
			arrow_images=st.arrow_images;
		}else if(h.arrowType=="grayimage"){
			arrow_images=st.arrow_raw_images;
		}

		["left_data","down_data","up_data","right_data","space_data"].forEach(function(x,i){
			ctx.fillStyle=h.color.arrow[x];	//hard coding
			ctx.font=h.font[x];
			if(t.index==i)ctx.fillStyle="#ff4444";	//hard coding

			host.drawArrow(ctx,h.pos[x],h.arrowy,x,arrow_images);
			ctx.font=h.font.normal;
			ctx.fillText(t.user.keys ? host.charString(t.user.keys[x]) : "???",h.pos[x]+5,h.arrowy+40);	//hard coding
		});
		host.writebi(ctx,h.fontinfo.keyconfig.message,"Escキーを押すと終了します");
	},
});
function ConfigPanel(game,event,param){
	ChildPanel.apply(this,arguments);
	this.index=0;
}
ConfigPanel.prototype=Game.util.extend(ChildPanel,{
	init:function(game,event,param){
		var t=this, p=this.parent;
		event.on("changeindex",function(index){
			t.index=index;
		});
		event.on("setconfig",function(key,value){
			p.config[key]=value;
		});
		this.user.event.on("keydown",khandler);
		this.event.on("die",function(){
			t.user.event.removeListener("keydown",khandler);
		});
		function khandler(dir,c){
			if(c===27){
				//Esc
				t.parent.openPanel(game,"title");
				return;
			}
			if(dir==="up"){
				t.index--;
				if(t.index<0)t.index=0;
			}else if(dir==="down"){
				t.index++;
				if(t.index>=p.confs.length)t.index--;
			}else if(dir==="space"||dir==="left"||dir==="right"){
				//変更
				var name=p.confs[t.index].name;
				var vi=p.confs[t.index].values.indexOf(p.config[name]);
				if(dir==="left"){
					vi--;
				}else{
					vi++;
				}
				if(vi>=p.confs[t.index].values.length){
					vi=0;
				}
				if(vi<0)vi=p.confs[t.index].values.length-1;
				//p.config[name]=p.confs[t.index].values[vi];
				t.event.emit("setconfig",name,p.confs[t.index].values[vi]);
			}else{
				return;
			}
			t.event.emit("changeindex",t.index);
		}
	},
	renderInit:function(view,game){
		//実際は描画しないけど初期化だけしちゃう系
		var t=this, k=this.user.keys, host=this.parent.host, ev=this.event;
		return document.createElement("div");
	},
	renderCanvas:function(canvas,ctx,view){
		var host=this.parent.host, t=this, p=this.parent;
		var h=host.header, st=view.getStore(host);	//hostのデータ
		if(!h)return;
		p.confs.forEach(function(x,i){
			var px=80, py=80+30*i;
			ctx.fillStyle=h.color.color;
			ctx.font=h.font.normal;
			if(t.index==i)ctx.fillStyle="#ff4444";	//hard coding
			ctx.fillText(x.name,px,py);

			ctx.fillText(p.config[x.name],px+150,py);	//hard coding
		},this);
		host.writebi(ctx,h.fontinfo.keyconfig.message,"[Space][←][→]:変更　[Esc]:終了");
	},
	//---
});
//ゲーム画面
function GamePanel(game,event,param){
	ChildPanel.apply(this,arguments);
	var h=this.parent.host.header;
	this.modeindex=param.option.modeindex;
	//スコア
	this.score={
		excellent:0,
		great:0,
		good:0,
		bad:0,
		miss:0,
		freezegood:0,
		freezebad:0,
	};
	this.scorepoint=0;	//合計スコア
	//this.pf_scorenow=0;	//現在の合計スコア
	//ノルマ
	this.normapoint=h.norma.init;	//最初
	//演奏データ
	this.speed=1;
	//ここで譜面読み込み
	this.coms=null;
	var t=this, parent=this.parent, host=parent.host;

	loadHumen();
	//ゲーム開始要求
	if(parent.mediaReady){
		parent.event.emit("ready");
	}else{
		//まだ読み込めていない
		parent.event.once("mediaReady",function(){
			//読み込め次第
			parent.event.emit("ready");
		});
	}
	//譜面を読み込む関数
	function loadHumen(){
		var dobj=host.modes[t.modeindex];
		game.readFile(dobj.uri,"text",function(text){
			var obj=JSON.parse(text);
			//譜面を読み込む
			var coms=t.coms=t.loadHumen(obj);
			//パーフェクト時のスコアを計算しておく
			var pf_score=0;
			for(var i=0,l=coms.length;i<l;i++){
				var c=coms[i];
				if(c.type!=="speed_change" && c.type!=="color_data"){
					//no miss!
					if(c.freeze){
						pf_score += h.scorevalue.freezegood;
					}else{
						pf_score += h.scorevalue.excellent;
					}	
				}
			}
			t.pf_score=pf_score;
		});
		t.speed=dobj.speedlock;
	}
}
GamePanel.prototype=Game.util.extend(ChildPanel,{
	init:function(game,event,param){
		var user=this.user, t=this, parent=this.parent, host=parent.host;
		//矢印ヒット！
		user.event.on("keyinput",function(obj){
			event.emit("keyinput",obj);
		});
		event.on("keyinput",function(obj){
			var frame=obj.frame, targetframe=obj.targetframe, type=obj.type;	//合致するものを探す
			var h=host.header, coms=t.coms;
			for(var i=0,l=coms.length;i<l;i++){
				var co=coms[i];
				if(co.frame===targetframe && co.type===type){
					//目的のやつだ!
					var sa=Math.abs(frame-targetframe);	//誤差
					var sc="";
					if(sa<=2){
						sc="excellent";
					}else if(sa<=4){
						sc="great";
					}else if(sa<=6){
						sc="good";
					}else if(sa<=8){
						sc="bad";
					}else{
						break;
					}
					if(!co.freeze){
						t.getscore(sc,h);
						//effects.push(new ScoreEffect(h.pos[co.type],h.arrowy,sc));
						event.emit("effect",{
							x:h.pos[co.type],
							y:h.arrowy,
							score:sc,
						});
						coms.splice(i,1);
						i--,l--;
					}else{
						//とりあえずhitした
						co.hit=true;
					}
					break;
				}
			}
		});
		//矢印ロスト!
		user.event.on("lose",function(obj){
			event.emit("lose",obj);
		});
		event.on("lose",function(obj){
			var frame=obj.frame, type=obj.type;
			var h=host.header, coms=t.coms;
			for(var i=0,l=coms.length;i<l;i++){
				var co=coms[i];
				if(co.frame===frame && co.type===type){
					//目的のやつだ!
					coms.splice(i,1);
					i--,l--;
					var sc= co.freeze ? "freezebad" : "miss";
					t.getscore(sc,h);
					event.emit("effect",{
						x:h.pos[co.type],
						y:h.arrowy,
						score:sc,
					});
					break;
				}
			}
		});
		//フリーズヒット!
		user.event.on("freezeinput",function(obj){
			event.emit("freezeinput",obj);
		});
		event.on("freezeinput",function(obj){
			var frame=obj.frame, targetframe=obj.targetframe, type=obj.type;	//合致するものを探す
			var h=host.header, coms=t.coms;
			for(var i=0,l=coms.length;i<l;i++){
				var co=coms[i];
				if(co.frame===targetframe && co.type===type && co.freeze && co.hit){
					//目的のやつだ!
					var sc= co.end-5<=frame ? "freezegood" : "freezebad";
					t.getscore(sc,h);
					event.emit("effect",{
						x:h.pos[co.type],
						y:h.arrowy,
						score:sc,
					});
					coms.splice(i,1);
					i--,l--;
					break;
				}
			}
		});
		//すピード変更
		user.event.on("speed_change",function(obj){
			event.emit("speed_change",obj);
		});
		event.on("speed_change",function(obj){
			var frame=obj.frame, speed=obj.speed;
			var h=host.header, coms=t.coms;
			for(var i=0,l=coms.length;i<l;i++){
				var co=coms[i];
				if(co.frame===frame){
					//目的のやつだ!
					coms.splice(i,1);
					i--,l--;
					t.speed=speed;
					break;
				}
			}
		});
		//色変更
		user.event.on("color_data",function(obj){
			event.emit("color_data",obj);
		});
		event.on("color_data",function(obj){
			var frame=obj.frame, setcolor=obj.setcolor;
			var h=host.header, coms=t.coms;
			for(var i=0,l=coms.length;i<l;i++){
				var co=coms[i];
				var color=co.color;
				if(co.frame===frame && co.setcolor===setcolor){
					//目的のやつだ!
					switch(setcolor){
						case 0: h.color.arrow["left_data"]=color;break;
						case 2: h.color.arrow["down_data"]=color;break;
						case 3: h.color.arrow["space_data"]=color;break;
						case 4: h.color.arrow["up_data"]=color;break;
						case 6: h.color.arrow["right_data"]=color;break;

						case 36: h.color.freezearrow["space_data"]=color;break;
						case 37: h.color.freezeband["space_data"]=color;break;
						case 46: h.color.freezehitarrow["space_data"]=color;break;
						case 47: h.color.freezehitband["space_data"]=color;break;
						case 53: h.color.freezearrow["space_data"]=h.color.freezeband["space_data"]=color;break;
						case 58: h.color.freezehitarrow["space_data"]=h.color.freezehitband["space_data"]=color;break;

						default:	//一括系
								 var pa=({
									 20:[h.color.arrow],
									 30:[h.color.freezearrow],
									 31:[h.color.freezeband],
									 40:[h.color.freezehitarrow],
									 41:[h.color.freezehitband],
									 50:[h.color.freezearrow,h.color.freezeband],
									 55:[h.color.freezehitarrow,h.color.freezehitband],
									 60:[h.color.freezearrow,h.color.freezeband],
									 61:[h.color.freezehitarrow,h.color.freezehitband],

									 100:[h.color.arrow],
								 })[setcolor];

								 var datas=["left_data","down_data","up_data","right_data"];

								 if(setcolor===100 || setcolor===60 || setcolor===61){
									 datas[4]="space_data";
								 }
								 if(!pa)break;

								 datas.forEach(function(x){
									 pa.forEach(function(y){
										 y[x]=color;
									 });
								 });
								 break;
					}
					coms.splice(i,1);
					i--,l--;
					break;
				}
			}
		});

	},
	showResult:function(game){
		//結果を表示する
		var parent=this.parent, host=parent.host, h=host.header;
		var score=this.score;	//スコアオブジェクト
		//ポイントに換算
		var scorepoint=0;
		["excellent","great","good","bad","miss","freezegood","freezebad"].forEach(function(x){
			scorepoint+=h.scorevalue[x]*score[x];
		});
		//割合を出す
		var rate=scorepoint/this.pf_score*100;
		//低いほうからチェックしよう
		var rank, rank_border=-1;
		for(var rankname in h.rankstr){
			if(rate>=h.rankstr[rankname] && h.rankstr[rankname]>rank_border){
				//もっと上の
				rank=rankname;
				rank_border=h.rankstr[rankname];
			}
		}
		//特殊
		if(rate<100 && score.miss===0 && score.freezebad===0){
			rank=h.rankspecial.fullcomplete;
		}
		//失敗したときはh.rankspecial.fail
		//結果を表示してもらう
		parent.openPanel(game,"result",{
			score:score,
			scorepoint:scorepoint,
			pf_score:this.pf_score,
			rank:rank,
		});
	},
	//h: header
	getscore:function(scorename,h){
		this.score[scorename]++;
		this.scorepoint+=h.scorevalue[scorename];
		//this.pf_scorenow+=h.scorevalue.excellent;
		this.normapoint+=h.norma.score[scorename];
		if(this.normapoint>h.norma.max)this.normapoint=h.norma.max;
		if(this.normapoint<0)this.normapoint=0;
	},
	renderInit:function(view,game){
		var t=this, user=this.user, k=this.user.keys,parent=this.parent, host=parent.host, ev=this.event, store=view.getStore(parent), sth=view.getStore(host);
		//再生可能になったら報告する
		if(user.internal){
			sth.mediaPlayer.oncanplaythrough(function(){
				//自分のユーザーは報告する
				user.event.emit("mediaReady");
				sth.mediaPlayer.onended(function(){
					//終了も報告する
					user.event.emit("mediaEnded");
				});
			});
		}
		host.useHeader(function(h){
			//me: 繰り返しするアレ clear:解除するアレ
			var me, m, cancel;
			if(me=window.requestAnimationFrame){
				cancel=window.cancelRequestAnimationFrame;
			}else if(me=window.webkitRequestAnimationFrame){
				cancel=window.webkitCancelRequestAnimationFrame;
			}else if(me=window.mozRequestAnimationFrame){
				cancel=window.mozCancelRequestAnimationFrame;
			}else if(me=window.oRequestAnimationFrame){
				cancel=window.oCancelRequestAnimationFrame;
			}
			if(me){
				m=function(func){
					var flag=true;//継続フラグ
					var id=me(c);
					return clear;
					
					function c(){
						func();
						if(flag){
							id=me(c);
						}
					}
					
					function clear(){
						flag=false;
						cancel(id);
					}
				};
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
				})(h.renderfps-0);
			}
			//描画準備
			var canvas=store.canvas;
			var ctx=canvas.getContext('2d');

			var dobj=host.modes[t.modeindex];
			store.difStep=dobj.difStep;
			var arrowwidths=store.arrowwidths={};
			["left_data","up_data","right_data","down_data"].forEach(function(x){
				if(h.arrowType==="image"){
					arrowwidths[x]=sth.arrow_images[x].naturalWidth;
				}else if(h.arrowType==="grayimage"){
					arrowwidths[x]=sth.arrow_raw_images[x].naturalWidth;
				}else{
					ctx.font=h.font[x];
					arrowwidths[x]=ctx.measureText(h.chars[x]).width;
				}
			});
			store.arrowy=h.arrowy;
			if(parent.config.Reverse=="on"){
				store.arrowy=canvas.height-store.arrowy+30;	//hard coding
			}
			//背景ありかどうか
			store.background= h.mediaType==="video" ? store.audio :
			                h.mediaType==="audioWithImage" ? g.image : null;
			//画像セット!
			t.setArrowImage(h,store,sth);
			//倍速
			store.flow_speed=1;
			var result;
			if(result=parent.config.Speed.match(/^x(\d+(?:\.\d+)?)/)){
				store.flow_speed=parseFloat(result[1]);
			}
			store.coll_sut=parseInt(parent.config.Correction);
			//エフェクト
			store.effects=[];
			ev.on("effect",function(obj){
				//エフェクト発動!!!!!
				if(parent.config.Reverse==="on"){
					//エフェクト位置も調整
					obj.y=canvas.height-obj.y+30;	//hard coding
				}
				store.effects.push(new ScoreEffect(obj.x,obj.y,obj.score,h));
			});
			//矢印色変更があった
			user.event.on("color_data",function(){
				t.setArrowImage(h,store,sth);
			});

			//解除の用意
			store.clearTimer=m(t.renderFrame.bind(t,canvas,ctx,h,parent,host,store,sth));

			ev.on("die",function(){
				store.clearTimer();
				//デフォルトのキー入力に戻す
				if(user.internal){
					console.log("uncapture!");
					store.uncapture();
					user.useStandardKeyCapture();
				}
			});
			//キー入力
			if(user.internal){
				user.unuseStandardKeyCapture();	//デフォルトは切る
				store.uncapture=user.capture(function(direction,keycode){
					//現在のフレーム
					var coms=t.coms;
					var audio=store.audio;
					var nowf=audio.currentTime*h.fps-store.coll_sut;	//現在のフレーム
					var dirstr=direction+"_data";
					//クライアント側で探してから送る
					for(var i=0,l=coms.length;i<l;i++){
						var co=coms[i];
						if(co.frame<nowf-8)continue;
						if(nowf+8<co.frame)break;
						if(dirstr===co.type){
							//押した
							var sa=Math.abs(nowf-co.frame);
							if(co.freeze && sa<=5){
								//フリーズアローだった
								document.addEventListener('keyup',function listener(e){
									if(e.keyCode===keycode){
										//キーを上げた
										var nowf=audio.currentTime*h.fps-store.coll_sut;	//現在のフレーム
										var sc;
										for(var i=0,l=coms.length;i<l;i++){
											if(coms[i]==co){
												//クリアした
												user.event.emit("freezeinput",{
													frame:nowf,
													targetframe:co.frame,
													type:co.type,
												});
												break;
											}
										}
										document.removeEventListener('keyup',listener,false);
									}
								},false);
							}else if(!co.freeze){
								/*getscore(sc);
								  effects.push(new ScoreEffect(h.pos[co.type],h.arrowy,sc));
								  coms.splice(i,1);
								  i--,l--;*/
							}
							//矢印があった!イベント発行
							user.event.emit("keyinput",{
								frame:nowf,
								targetframe:co.frame,
								type:co.type
							});
							break;
						}
					}
				});
			}
		});

		return document.createElement("div");
	},
	render:function(view){
		view.getItem();
	},
	renderCanvas:function(canvas,ctx,view){
		var host=this.parent.host, t=this, p=this.parent;
		var h=host.header, st=view.getStore(host);	//hostのデータ
		if(!h)return;
		if(host.state!==host.STATE_PREPARING)return;	//もう開始している
		ctx.fillStyle=h.color.color;
		ctx.font=h.font.normal;
		ctx.fillText("待機中...",50,50);	//hard
	},
	//毎フレームの描画
	renderFrame:function(canvas,ctx,h,p,host,store,sth){
		if(host.state!==host.STATE_PLAYING){
			//まだ始まっていない
			return;
		}
		//まず真っ黒に塗る
		var audio=store.audio;
		ctx.fillStyle=h.color.background;
		ctx.fillRect(0,0,canvas.width,canvas.height);
		/*ctx.fillStyle="#ffffff";
		ctx.fillText("ready:"+p.ready+" / "+String(host.mediaTimer.getTime())+","+String(audio.currentTime.toFixed(1))+","+audio.paused,50,50);*/
		if(store.background){
			//ビデオを表示する
			ctx.clearRect(0,0,store.background.width,store.background.height);
		}
		//2.0 [s] = Speedlock * (通過時間)[s]
		var sp=canvas.height/((2/this.speed)*h.fps);	//height[px]/((2.0/speed)[s]・fps[f/s])
		var nowf=audio.currentTime*h.fps;	//現在のフレーム
		var flow_speed=store.flow_speed;
		if(audio.paused){
			//まだ始まっていないではないか
			nowf=host.mediaTimer.getTime()/1000*h.fps;
		}
		//画面表示の限界
		var minf=nowf-h.trashrange;
		var maxf=nowf+canvas.height/sp/flow_speed;
		//描画
		ctx.save();
		ctx.globalAlpha=0.6;
		var arrowy=store.arrowy;
		["left_data","up_data","right_data","down_data","space_data"].forEach(function(x){
			ctx.fillStyle=h.color.arrow[x];
			ctx.font=h.font[x];
			//ctx.fillText(h.chars[x],h.pos[x],arrowy);
			host.drawArrow(ctx,h.pos[x],arrowy,x,sth.arrow_images);
		});
		ctx.restore();
		var coms=this.coms;
		if(!coms)return;	//まだない!!!

		for(var i=0,l=coms.length;i<l;i++){
			//矢印ひとつひとつ
			var c=coms[i];
			if(!c)continue;
			if((c.freeze?c.end:c.frame)<minf){
				//ロストした
				this.user.event.emit("lose",{
					frame:c.frame,
					type:c.type,
				});
				l=coms.length;	//hard
				//getscore(c.freeze ? "freezebad" : "miss");
				continue;
			}
			if(c.frame<nowf){
				if(c.type==="speed_change" && !c.done){
					//speed change
					this.user.event.emit("speed_change",{
						frame:c.frame,
						speed:c.speed,
					});
					c.done=true;	//処理済みマーク
					//speed=c.speed;	//スピード変更
				}else if(c.type==="color_data" && !c.done){
					//色変更
					this.user.event.emit("color_data",{
						frame:c.frame,
						setcolor:c.setcolor,
					});
					c.done=true;	//処理済みマーク
					//if(h.arrowType==="grayimage")this.setArrowImage();
				}
			}
			if(c.freeze && c.hit && c.end<=nowf){
				// 突破したのでOK
				this.user.event.emit("freezeinput",{
					frame:nowf,
					targetframe:c.frame,
					type:c.type,
				});
			}
			if(maxf<c.frame)break;	//sortされてるし
			if(!h.chars[c.type])continue;

			var spp= p.config.Reverse=="on" ? -sp : sp;	//反転処理
			spp *= flow_speed;	//スピード処理も
			ctx.font=h.font[c.type];
			if(c.freeze){
				//フリーズアロー！
				if(c.hit){
					ctx.fillStyle=h.color.freezehitband[c.type];	//帯
				}else{
					ctx.fillStyle=h.color.freezeband[c.type];	//帯
				}
				ctx.fillRect(h.pos[c.type],arrowy+(c.frame-nowf)*spp-20,store.arrowwidths[c.type],(c.end-c.frame)*spp+20);	//hard coding
				if(c.hit){
					ctx.fillStyle=h.color.freezehitarrow[c.type];
				}else{
					ctx.fillStyle=h.color.freezearrow[c.type];
				}
				host.drawArrow(ctx,h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp,c.type,sth.arrow_images);
				//ctx.fillText(h.chars[c.type],h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp);
				host.drawArrow(ctx,h.pos[c.type] || 0,arrowy+(c.end-nowf)*spp,c.type,sth.arrow_images);
				//ctx.fillText(h.chars[c.type],h.pos[c.type] || 0,arrowy+(c.end-nowf)*spp);
			}else{
				ctx.fillStyle=h.color.arrow[c.type];
				//console.log(h.color.arrow[c.type]);
				//ctx.fillText(h.chars[c.type] || "undef",h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp);
				host.drawArrow(ctx,h.pos[c.type] || 0,arrowy+(c.frame-nowf)*spp,c.type,sth.arrow_images);
			}
		}
		//スコア
		ctx.font=h.font.score;
		var i=0, area=h.infoarea;
		for(var x in this.score){
			//g.writebi(ctx,h.fontinfo.score[x],h.scorename[x]+" "+score[x]);
			ctx.fillStyle=h.color.score[x];
			//hard coding
			ctx.fillText(h.scorename[x]+" "+this.score[x],area.x,area.scorey+area.scoredeltay*i);
			i++;
		}
		//光景スコア
		ctx.fillStyle=h.color.color;
		ctx.fillText(this.scorepoint+" / "+this.pf_score, area.x, area.scorepointy);

		if(area.timeinfo){
			//時間
			ctx.fillText(timeString(audio.currentTime)+" / "+timeString(audio.duration),area.x,area.timey);
		}
		//エッフェクト
		var ef=store.effects;
		for(var i=0,l=ef.length;i<l;i++){
			var e=ef[i];
			e.main(ctx);
			if(!e.alive){
				ef.splice(i,1);
				i--,l--;
				continue;
			}
		}
		//ノルマバー
		//中
		ctx.save();
		ctx.globalAlpha=h.color.gauge.alpha;
		var height=this.normapoint/h.norma.max*h.gaugepos.height;
		ctx.fillStyle=this.normapoint>=h.norma.clear ? h.color.gauge.above : h.color.gauge.below;
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

		//秒数をmm:ss型にする
		function timeString(sec){
			var m=Math.floor(sec/60);
			return m+":"+("0"+(Math.floor(sec)%60)).slice(-2);
		}
	},
	//矢印の画像更新
	setArrowImage:function(h,store,sth){
		if(h.arrowType!="grayimage")return;
		["left_data","down_data","up_data","right_data","space_data"].forEach(function(n){
			//h.color.arrow
			var c=sth.arrow_images[n];
			if(!c.getContext){
				c=sth.arrow_images[n]=sth.arrow_raw_images[n].ownerDocument.createElement("canvas");
				c.width=sth.arrow_raw_images[n].naturalWidth;
				c.height=sth.arrow_raw_images[n].naturalHeight;
			}
			var cx=c.getContext('2d');
			//矢印のキャンバス
			cx.drawImage(sth.arrow_raw_images[n],0,0);
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
	},
	//譜面をロードして配列を返す
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
});
//エフェクト定義(client用)
function Effect(x,y){
	this.alive=true;
	this.x=x,this.y=y;
}
Effect.prototype={
	main:function(){
	},
};
function ScoreEffect(x,y,score,h){
	Effect.apply(this,arguments);
	this.op=1;
	this.score=score;
	this.h=h;	//header
}
ScoreEffect.prototype.main=function(ctx){
	var h=this.h;
	this.y-=120/h.fps;
	this.op-=1.2/h.fps;	//1.2[point/s]
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
function ResultPanel(game,event,param){
	ChildPanel.apply(this,arguments);
	//スコア情報
	var opt=param.option;
	this.score=opt.score;
	this.scorepoint=opt.scorepoint;
	//割合
	this.pf_score=opt.pf_score;
	this.rate=this.scorepoint/this.pf_score*100;
	this.rank=opt.rank;
	//戻る準備
	this.ready=false;
}
ResultPanel.prototype=Game.util.extend(ChildPanel,{
	init:function(game,event,param){
		var t=this;
		this.user.event.on("keydown",khandler);
		this.event.on("die",function(){
			t.user.event.removeListener("keydown",khandler);
		});
		function khandler(dir,c){
			//キー押したら最初に戻る
			t.parent.event.emit("back");
		}
	},
	renderInit:function(view,game){
		//実際は描画しないけど初期化だけしちゃう系
		var t=this, k=this.user.keys, host=this.parent.host, ev=this.event;
		return document.createElement("div");
	},
	renderCanvas:function(canvas,ctx,view){
		var host=this.parent.host, t=this;
		var h=host.header;
		var score=this.score, rank=this.rank;
		
		//ランク表示
		host.writebi(ctx,h.fontinfo.rank,rank);
		//スコア
		ctx.font=h.font.score;
		var i=0;
		for(var x in score){
			ctx.fillStyle=h.color.score[x];
			//hard coding
			ctx.fillText(h.scorename[x]+" "+score[x],h.infox,80+i*25);
			i++;
		}
		//次へ
		host.writebi(ctx,h.fontinfo.musictitle.mode_desc,"Press any key to return");
	},
});
function GonePanel(game,event,param){
	ChildPanel.apply(this,arguments);
}
GonePanel.prototype=Game.util.extend(ChildPanel,{
	init:function(game,event,param){
	},
	renderInit:function(view,game){
		//実際は描画しないけど初期化だけしちゃう系
		var t=this, k=this.user.keys, host=this.parent.host, ev=this.event;
		return document.createElement("div");
	},
	renderCanvas:function(canvas,ctx,view){
		var host=this.parent.host, h=host.header;
		
		//hard coding
		host.writebi(ctx,h.fontinfo.rank,"GONE");
	},
});
