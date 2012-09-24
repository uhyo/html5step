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
				//方向情報をアレする
				var c=e.keyCode, k=user.keys;
				var direction= c===k.left_data || c===37? "left" :
				               c===k.up_data || c===38? "up" :
				               c===k.right_data || c===39? "right" :
				               c===k.down_data || c===40? "down" :
				               c===k.space_data || c===32? "space" : "";

				user.event.emit("keydown",direction,e.keyCode);
				e.preventDefault();
			},false);
		});
		//ゲームの初期化
		game.event.on("gamestart",function(){
			var host=game.add(OnigiriHost);
			//host.event.emit("loadHeader","header.json");
			game.readFile("header.json",function(data){
				var j=JSON.parse(data);	//ヘッダーを読み込んだ
				host.event.emit("loadHeader",j);
			});
			//ユーザー出現
			game.event.on("entry",function(user){
				var panel=game.add(PlayerPanel,{
					host:host,
					user:user,
				});
				host.event.emit("addPlayer",panel);
				panel.openPanel(game,"title");
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
	this.mediaTimer=game.getTimer();
}
OnigiriHost.prototype={
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
			if(t.users.every(function(p){return p.ready})){
				//スタートだ!!
				t.mediaTimer.setTime(-1600);
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

		//this.event.emit("loadAudio",opt.mediaURI);
		//矢印ロード
		//this.event.emit("loadArrows",opt.arrowType,opt.arrowImage);
	},
	//--render
	renderTop:true,
	renderInit:function(view){
		var t=this;
		var ev=view.getEvent(), store=view.getStore();
		var div=document.createElement("div");
		//イベント
		//オーディオマネージャ
		store.mediaController=new MediaController();
		store.mediaController.pause();
		//オーディオ読み込み指令
		ev.on("ready",function(){
			//タイムライン開始（オーディオ開始）
			var timer=t.mediaTimer;
			timer.addFunc(0,function(){
				//0になったらオーディオ開始
				store.mediaController.currentTime=0;
				//ほんとはplay()で全て再生されるはずだけど・・・（ブラウザ対応待ち）
				store.mediaController.play();
			});
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
		this.event.once("getHeader",cb);
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
	this.ready=false;	//ゲーム開始準備ができたかどうか
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
		//パネル起動
		event.on("openPanel",function(panel){
			t.panel=panel;
		});
		//メディア準備
		user.event.on("mediaReady",function(){
			t.ready=true;
			t.host.event.emit("ready",t);
		});
	},
	renderInit:function(view){
		var host=this.host, h=host.header, store=view.getStore();
		//canvasを作る
		var c=document.createElement("canvas");
		c.width=h.canvas.x, c.height=h.canvas.y;
		store.canvas=c;
		//メディアスターと
		var evv=view.getEvent(host);
		evv.on("ready",function(){
			//0になったらはじめる
			host.mediaTimer.addFunc(0,function(){
				store.audio.play();
			});
		});
		return c;
	},
	render:function(view){
		var c=view.getItem(), store=view.getStore(), h=this.host.header;
		//メディア読み込み
		if(!store.audio && h){
			var au=new Audio();
			au.preload="auto";
			au.autoplay=true;	//自動読み込み有効にするため
			au.src=h.mediaURI;
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
			//コントローラーに登録
			var st2=view.getStore(this.host);
			au.controller=st2.mediaController;
			
			if(h.mediaType==="audioWithImage"){
				//静止画像が必要
				store.image=new Image();
				store.image.src=h.mediaImageURI;
			}
		}
		var ctx=c.getContext('2d');
		//まず真っ黒に塗る
		ctx.fillStyle=h.color.background;
		ctx.fillRect(0,0,c.width,c.height);

		if(this.panel){
			//パネルがある
			view.render(this.panel);	//初期化だけ・・・
			this.panel.renderCanvas(c,ctx,view);
		}
	},
	//--internal
	openPanel:function(game,mode,option){
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
		}
		if(con){
			var panel=game.add(con,{
				user:this.user,
				parent:this,
				option:option,
			});
			this.event.emit("openPanel",panel);
			return panel;
		}
		return null;
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
			if(dir==="up"){
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
			}else if(dir==="space"){
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
	render:function(view){
		view.getItem();
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
	render:function(view){
		view.getItem();
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
	this.modeindex=param.option.modeindex;
	//ここで譜面読み込み
	this.coms=null;
	var t=this, host=this.parent.host;

	loadHumen();
	//譜面を読み込む関数
	function loadHumen(){
		var dobj=host.modes[t.modeindex];
		game.readFile(dobj.uri,"text",function(text){
			var obj=JSON.parse(text);
			//譜面を読み込む
			console.log(text);
			t.coms=t.loadHumen(obj);
		});
	}
}
GamePanel.prototype=Game.util.extend(ChildPanel,{
	renderInit:function(view,game){
		var t=this, user=this.user, k=this.user.keys,parent=this.parent, host=parent.host, ev=this.event, store=view.getStore(parent), sth=view.getStore(host);
		//現在のリソース状態を報告する
		if(store.audio.readyState===4){
			//準備ができた HAVE_ENOUGH_DATA
			user.event.emit("mediaReady");
		}else{
			store.audio.addEventListener("canplaythrough",function handler(e){
				user.event.emit("mediaReady");
				store.audio.removeEventListener("canplaythrough",handler,false);
			},false);
		}
		//描画するぞ!!!
		host.useHeader(function(h){
			//me: 繰り返しするアレ clear:解除するアレ
			var me, m;
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
			//描画準備
			var canvas=store.canvas;
			var ctx=canvas.getContext('2d');

			var dobj=host.modes[t.modeindex];
			store.difStep=dobj.difStep;
			store.speed=dobj.speedlock;
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
				store.arrowy=canvas.height-arrowy+30;	//hard coding
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
				flow_speed=parseFloat(result[1]);
			}
			store.coll_sut=parseInt(parent.config.Correction);
			//エフェクト
			store.effects=[];

			//解除の用意
			store.clearTimer=m(t.renderFrame.bind(t,canvas,ctx,h,parent,host,store,sth));
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
		ctx.fillStyle=h.color.color;
		ctx.font=h.font.normal;
		ctx.fillText("待機中...",50,50);
	},
	//毎フレームの描画
	renderFrame:function(canvas,ctx,h,p,host,store,sth){
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
		var sp=canvas.height/((2/store.speed)*h.fps);	//height[px]/((2.0/speed)[s]・fps[f/s])
		var nowf=audio.currentTime*h.fps;	//現在のフレーム
		var flow_speed=store.flow_speed;
		if(audio.paused){
			//まだ始まっていないではないか
			nowf=host.mediaTimer.getTime()/1000*h.fps;
		}
		//画面表示の限界
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
			if((c.freeze?c.end:c.frame)<nowf-h.trashrange){
				coms.splice(i,1);
				i--,l--;
				//getscore(c.freeze ? "freezebad" : "miss");
				continue;
			}
			if(c.frame<nowf){
				if(c.type=="speed_change"){
					//speed change
					//speed=c.speed;	//スピード変更
					coms.splice(i,1);
					i--,l--;
				}else if(c.type=="color_data"){
					//色変更
					/*switch(c.setcolor){
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
					}*/
					if(h.arrowType=="grayimage")this.setArrowImage();
					coms.splice(i,1);
					i--,l--;
				}
			}
			if(c.freeze && c.hit && c.end<=nowf){
				// 突破したのでOK
				/*getscore("freezegood");
				effects.push(new ScoreEffect(h.pos[c.type],h.arrowy,"freezegood"));*/
				coms.splice(i,1);
				i--,l--;
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
// ゲーム開始
var o=new Onigiri;
o.init();
