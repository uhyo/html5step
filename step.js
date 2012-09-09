//ゲーム初期化?
function Onigiri(){
	this.game=null;
}
Onigiri.prototype={
	init:function(){
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
			user.addEventListener("keydown",function(e){
				user.event.emit("keydown",e.keyCode);
				e.preventDefault();
			},false);
		});
		//ゲームの初期化
		game.event.on("gamestart",function(){
			var host=game.add(OnigiriHost);
			host.event.emit("loadHeader","header.json");
			//ユーザー出現
			game.event.on("entry",function(user){
				var panel=game.add(PlayerPanel,{
					host:host,
					user:user,
				});
				host.event.emit("addPlayer",panel);
			});
		});
		game.init(Game.ClientDOMView);
		game.start();
	},
};
//Onigiri Host
function OnigiriHost(game,event,param){
	this.header=null;	//loadしたらオブジェクト
	this.users=[];	//PlayerPanel
}
OnigiriHost.prototype={
	init:function(game,event,param){
		var t=this;
		event.on("loadHeader",function(filename){
			game.readFile(filename,function(data){
				var j=JSON.parse(data);
				//headが読み込まれた
				t.setHeader(j);
			});
		});
		//プレイヤー追加
		event.on("addPlayer",function(panel){
			t.users.push(panel);
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

		this.event.emit("loadAudio",opt.mediaURI);
	},
	//--render
	renderTop:true,
	renderInit:function(view){
		var t=this;
		var ev=view.getEvent(), store=view.getStore();
		var div=document.createElement("div");
		//イベント
		//オーディオ読み込み指令
		ev.on("loadAudio",function(uri){
			var au=new Audio();
			au.preload="auto";
			au.autoplay=true;	//自動読み込み有効にするため
			au.src=uri;
			au.muted=true;
			au.hidden=true;
			//プレイ時は止める
			au.addEventListener("play",function handler(e){
				au.pause();
				au.muted=false;
				au.removeEventListener("play",handler,false);
			},false);
			au.play();
			store.audio=au;
		});
		return div;
	},
	render:function(view){
		var d=view.getItem();
		while(d.hasChildNodes())d.removeChild(d.firstChild);

		if(this.header){
			//子どもたちを入れる
			for(var i=0,l=this.users.length;i<l;i++){
				d.appendChild(view.render(this.users[i]));
			}
		}
	},
	//----- client
	//infoオブジェクトをもとに書き込み ox,oy: もとの位置からのずれ
	writebi:function(ctx,info,str,ox,oy){
		ctx.font=info.font;
		if(info.color)ctx.fillStyle=info.color;
		ctx.fillText(str,info.x + (ox?ox:0),info.y+(oy?oy:0));
	},

	//default Header
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
};
//プレイヤーパネル
function PlayerPanel(game,event,param){
	this.host=param.host;	//OnigiriHost
	this.user=param.user;
	//タイトル画面を表示させる
	this.panel=game.add(TitlePanel,{
		user:this.user,
		parent:this,
	});
}
PlayerPanel.prototype={
	init:function(game,event,param){
	},
	renderInit:function(view){
		var h=this.host.header;
		//canvasを作る
		var c=document.createElement("canvas");
		c.width=h.canvas.x, c.height=h.canvas.y;
		return c;
	},
	render:function(view){
		var c=view.getItem();
		var ctx=c.getContext('2d');
		//まず真っ黒に塗る
		var h=this.host.header;
		ctx.fillStyle=h.color.background;
		ctx.fillRect(0,0,c.width,c.height);

		if(this.panel){
			//パネルがある
			view.render(this.panel);	//初期化だけ・・・
			this.panel.renderCanvas(c,ctx);
		}
	},
};
//------プレイヤーパネルの子になる感じのやつ
//タイトル
function TitlePanel(game,event,param){
	this.parent=param.parent;
	this.user=param.user;
	//モード選択のindex
	this.index=0;
}
TitlePanel.prototype={
	init:function(game,event,param){
		var t=this;
		event.on("changeindex",function(index){
			t.index=index;
		});

	},
	renderInit:function(view){
		//実際は描画しないけど初期化だけしちゃう系
		var t=this, k=this.user.keys, host=this.parent.host;
		console.log("in!");
		this.user.event.on("keydown",khandler);
		this.event.on("die",function(){
			t.user.event.removeListener("keydown",khandler);
		});
		return document.createElement("div");
		function khandler(c){
			if(c==k.up_data || c==38){
				//↑
				if(t.index>=0){
					t.index=Math.max(0,t.index-1);
				}else{
					t.index=Math.min(-1,t.index+1);
				}
			}else if(c==k.down_data || c==40){
				//↓
				if(t.index>=0){
					t.index=Math.min(t.index+1,host.modes.length-1);
				}else{
					t.index=Math.max(-2,t.index-1);
				}
			}else if(c==k.left_data || c==37 || c==k.right_data || c==39){
				//←→
				if(t.index>=0)t.index=-1;
				else t.index=0;
			}else if(c==k.space_data || c==32){
				//Space
				/*if(t.index==-1){
					//Key Config
					//上乗せでkeyConfigを開く
					g.startProcess(g.commands.keyconfig);
				}else if(t.index==-2){
					//Config
					g.startProcess(g.commands.config);
				}else{
					g.startProcess(g.commands.game,{modeindex:t.index});
				}*/
			}else{
				return;
			}
			t.event.emit("changeindex",t.index);
		}
	},
	render:function(view){
		view.getItem();
	},
	renderCanvas:function(canvas,ctx){
		var host=this.parent.host, t=this;
		var h=host.header;
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
};
// ゲーム開始
var o=new Onigiri;
o.init();
