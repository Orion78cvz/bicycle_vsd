//*** 初期化処理 ************************************************************

function Initialize(){
	Scale = Vsd.Height / 720;
	
	//////////////////////////////////////////////////////////////////////////
	/// ↓↓↓↓↓OpenStreetMap の設定 ここから↓↓↓↓↓ ////////////////////
	//////////////////////////////////////////////////////////////////////////
	
	// 設定を行うためには，以下の設定値を直接書き換えてください．
	
	MapParam = {
		// ズームレベルを 0～19 で指定します
		Zoom: 13,
		
		// 地図表示位置，サイズ
		X:		0 * Scale,
		Y:		0 * Scale,
		Width:	240 * Scale,
		Height:	240 * Scale,
		
		// 走行軌跡
		PathColor:	0x00BBCC,	// -1 で非表示
		PathWidth:	4 * Scale,
		
		// 自車インジケータ
		IndicatorSize:	8 * Scale,		// サイズ
		IndicatorColor:	0x0080FF,		// 色
	};
	
	//////////////////////////////////////////////////////////////////////////
	/// ↑↑↑↑↑OpenStreetMap の設定 ここまで↑↑↑↑↑ ////////////////////
	//////////////////////////////////////////////////////////////////////////
	
	MeterRight = 1;
	
	// 使用する画像・フォントの宣言
	FontS = new Font( "ＭＳ Ｐゴシック", 20 * Scale );
	FontJ = new Font( "ＭＳ Ｐゴシック", 31 * Scale );
	FontM = new Font( "Impact", 31 * Scale, FONT_FIXED );
	FontL = new Font( "ＭＳ ゴシック", 64 * Scale );
	
	// スピードメータ用最高速
	MaxSpeed = 50;//Math.ceil( Log.Max.Speed / 10 ) * 10;
	
	// 座標等を予め計算しておく
	MeterR  = 64 * Scale;
	MeterX	= MeterRight ? Vsd.Width  - MeterR * 2 : 0;
	MeterY	= Vsd.Height - MeterR * 2 * 0.88;
	
	MeterParam = {
		X:			MeterX + MeterR,
		Y:			MeterY + MeterR,
		R:			MeterR,
		Line1Len:	MeterR * 0.1,
		Line1Width:	2,
		Line1Color:	0xFFFFFF,
		Line1Cnt:	12,
		Line2Len:	MeterR * 0.05,
		Line2Width:	1,
		Line2Color:	0xFFFFFF,
		Line2Cnt:	2,
		NumR:		MeterR * 0.78,
		FontColor:	0xFFFFFF,
		Font:		FontS,
		MinAngle:	135,
		MaxAngle:	45,
		MinVal:		0,
		MaxVal:		MaxSpeed,
	};
	MeterParam2 = {
		X:			Vsd.Width - 280 * Scale,
		Y:			Vsd.Height - FontM.Height * 8,
	};
	
	FontColor = 0xfaf0f6;
	FontColorBlack = 0x222222;
	BGColor = 0x222222;
	BGColorBlack = 0xfaf0e6;
	
	//心拍数設定
	HR_MAX = 181;
	HR_MIN = 50;
	HR_Zones = [
		{
			Name: "Z5",
			HRThreshold: (HR_MAX - HR_MIN) * 0.9 + HR_MIN,
			//HRThreshold: HR_MAX * 0.9,
			FontColor: 0x3333ff,
		},
		{
			Name: "Z4",
			HRThreshold: (HR_MAX - HR_MIN) * 0.8 + HR_MIN,
			//HRThreshold: HR_MAX * 0.8,
			FontColor: 0x33ff33,
		},
		{
			Name: "Z3",
			HRThreshold: (HR_MAX - HR_MIN) * 0.7 + HR_MIN,
			//HRThreshold: HR_MAX * 0.7,
			FontColor: 0xffff33,
		},
		{
			Name: "Z2",
			HRThreshold: (HR_MAX - HR_MIN) * 0.6 + HR_MIN,
			//HRThreshold: HR_MAX * 0.6,
			FontColor: 0xff3333,
		},
		{
			Name: "Z1",
			HRThreshold: (HR_MAX - HR_MIN) * 0.5 + HR_MIN,
			//HRThreshold: HR_MAX * 0.5,
			FontColor: 0xff9922,
		},
		{
			Name: "Z0",
			HRThreshold: 0,
			FontColor: FontColor,
		},
	];
	
}

function ResolveHeartRate(zones, hr){
	hr = (Number.isInteger(hr) ? hr : parseInt(hr)) || 0;
	return zones.find(z => hr >= z.HRThreshold);
}

//*** メーター描画処理 ******************************************************

function DrawDateTime(){
	var Y = Vsd.Height - FontS.Height*2;
	var date = new Date();
	date.setTime( Vsd.DateTime );

	Vsd.DrawRect( 0, Y, 200, Vsd.Height, BGColorBlack, DRAW_FILL );
	
	Vsd.DrawText( 0, Y,
		date.getFullYear() + "/" +
			( date.getMonth() + 1 < 10 ? "0" : "" ) + ( date.getMonth() + 1 ) + "/" +
			( date.getDate() < 10 ? "0" : "" ) + date.getDate(),
		FontS, FontColorBlack
	);
	Y += FontS.Height;
	
	Vsd.DrawText( 0, Y,
		( date.getHours() < 10 ? "0" : "" ) + date.getHours() + ":" +
			( date.getMinutes() < 10 ? "0" : "" ) + date.getMinutes() + ":" +
			( date.getSeconds() < 10 ? "0" : "" ) + date.getSeconds() + 
			( Log.ExtTemperature !== undefined ? "  (" + Log.ExtTemperature.toFixed( 0 ) + "℃)" : "" ),
		FontS, FontColorBlack
	);
	Y += FontS.Height;

}

function DrawSpeedMeter(){
	// メーター画像描画
	Vsd.DrawCircle( MeterParam.X, MeterParam.Y, MeterR, BGColor, DRAW_FILL );
	
	// スピードメーター目盛り描画
	Vsd.DrawRoundMeterScale( MeterParam );
	
	// スピード数値表示
	Vsd.DrawTextAlign(
		MeterParam.X, MeterParam.Y + MeterR * 0.25, 
		ALIGN_HCENTER | ALIGN_VCENTER,
		~~Log.Speed, FontM, 0xFFFFFF
	);
	
	Vsd.DrawTextAlign(
		MeterParam.X, MeterParam.Y + MeterR * 0.5,
		ALIGN_HCENTER | ALIGN_VCENTER,
		"kph", FontS, 0xFFFFFF
	);
	
	// スピードメーター針
	Vsd.DrawNeedle(
		MeterParam.X, MeterParam.Y, MeterR * 0.95, MeterR * -0.1,
		135, 45, Log.Speed / MaxSpeed, 0xFF0000, 3
	);
	
	
}

function Draw(){
	DrawDateTime();
	
	//DrawSpeedMeter();
	
	// Google マップ表示
	Vsd.DrawRoadMap( MapParam );
	var pr = Log.Distance / Log.Max.Distance;
	Vsd.DrawLine(MapParam.X, MapParam.Y + MapParam.Height + 8, MapParam.X + MapParam.Width, MapParam.Y + MapParam.Height + 8, BGColor, 5);
	Vsd.DrawLine(MapParam.X, MapParam.Y + MapParam.Height + 8, MapParam.X + MapParam.Width * pr, MapParam.Y + MapParam.Height + 8, 0xffd700, 6);	
	
	// 文字データ
	var Y = MeterParam2.Y;
	
	
	if( Log.Longitude != undefined )
	{
		Vsd.DrawText( MeterParam2.X, Y, "距離: " + ( (Log.ExtDistance !== undefined ? Log.ExtDistance : Log.Distance) / 1000 ).toFixed( 2 ) + "km", FontJ, FontColor );
		Y += FontJ.Height;
		
		Vsd.DrawText( MeterParam2.X, Y, "速度: " + ( (Log.Speed !== undefined ? Log.Speed : 0.0).toFixed( 1 ) + "km/h"), FontJ, FontColor );
		Y += FontJ.Height;
		
		
		Y += FontJ.Height;
		
		Vsd.DrawText( MeterParam2.X, Y, "標高: " + ( Log.Altitude !== undefined ? Log.Altitude.toFixed( 1 ) + "m" : "---" ), FontJ, FontColor );
		Y += FontJ.Height;
		Vsd.DrawText( MeterParam2.X, Y, "勾配: " + ( Log.ExtGradient !== undefined ? Log.ExtGradient.toFixed( 1 ) + "％" : "---" ), FontJ, FontColor );
		Y += FontJ.Height;

		Y += FontJ.Height;
		
		z = ResolveHeartRate(HR_Zones, Log.ExtHeartrate);
		Vsd.DrawText( MeterParam2.X, Y, "心拍数: " + ( Log.ExtHeartrate !== undefined ? Log.ExtHeartrate.toFixed( 0 ) + "bpm(" + z.Name + ")" : "---" ), FontJ, FontColor );
		Y += FontJ.Height;

		//Vsd.DrawText( MeterParam2.X, Y, "パワー: " + ( Log.ExtPower !== undefined ? Log.ExtPower.toFixed( 0 ) + "W": "---" ), FontJ, FontColor );
		//Y += FontJ.Height;

		//Vsd.DrawText( MeterParam2.X, Y, "ケイデンス:" + ( Log.ExtCadence !== undefined ? Log.ExtCadence.toFixed( 0 ) + "rpm": "---" ), FontJ, FontColor );
		//Y += FontJ.Height;
		
	}	
}
