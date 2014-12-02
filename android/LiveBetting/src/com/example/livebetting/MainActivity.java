package com.example.livebetting;

import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.view.Menu;
import android.widget.TextView;

public class MainActivity extends Activity {
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		
		
		
		if(!AuthAPI.getInstance().isLogedIn(this)){
			Log.d("LiveBettingMainActivity","not logged in");
			Intent newIntent = new Intent(MainActivity.this, LogIn.class);
			startActivity(newIntent);
		}else{
			Log.d("LiveBettingMainActivity","not logged in");
			Intent newIntent = new Intent(MainActivity.this, LogIn.class);
			startActivity(newIntent);
		}
		
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

}
