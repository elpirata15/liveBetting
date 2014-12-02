package com.example.livebetting;

import org.json.JSONException;
import org.json.JSONObject;

import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

public class LogIn extends Activity {
	
	Button login;
	TextView register;
	EditText username, password;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_log_in);
		
		login = (Button)findViewById(R.id.buttonLogin);
		register = (TextView)findViewById(R.id.textRegister);
		
		username = (EditText)findViewById(R.id.inputUsername);
		password = (EditText)findViewById(R.id.inputPassword);
		
		login.setOnClickListener(new View.OnClickListener() {
			
			@Override
			public void onClick(View v) {
				// TODO Auto-generated method stub
				
				Log.d("LogIn","pressed log in");
				
			/*	List<NameValuePair> params = new ArrayList<NameValuePair>();
					params.add(new BasicNameValuePair("email", username.getText().toString()));
					params.add(new BasicNameValuePair("pass", password.getText().toString()));*/
				
				JSONObject params = new JSONObject();
				try {
					params.put("email", username.getText().toString());
					params.put("pass", password.getText().toString());
				} catch (JSONException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
				
				Log.d("LogIn","pressed log in1");
				
				JSONObject returnedData = AuthAPI.getInstance().logMeIn(params, LogIn.this);
				
				Log.d("LogIn","pressed log in1"+params.toString());
				Log.d("LogIn","pressed log in2");
				//Log.d("LogIn","pressed log in1"+returnedData.toString());
				try {
					if(returnedData.has("_id")){
						Log.d("LogIn","returnd data with id ="+returnedData.getString("_id"));
						Intent newIntent = new Intent(LogIn.this, GamesList.class);
						startActivity(newIntent);
					}else{
						Toast toast = Toast.makeText(LogIn.this, returnedData.getString("error"), Toast.LENGTH_LONG);
						toast.show();
						Log.d("LogIn","returnd data = null yeaaaa");
					}
				} catch (JSONException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		});
		
		register.setOnClickListener(new View.OnClickListener() {
			
			@Override
			public void onClick(View v) {
				// TODO Auto-generated method stub
				JSONObject params = new JSONObject();
				try {
					params.put("email", username.getText().toString());
					params.put("pass", password.getText().toString());
				} catch (JSONException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
				
				Log.d("SignIn","pressed sign in1");
				
				JSONObject returnedData = AuthAPI.getInstance().logMeIn(params, LogIn.this);
				
				Log.d("SignIn","pressed sign in1"+params.toString());
				Log.d("SignIn","pressed sign in2");
				//Log.d("LogIn","pressed log in1"+returnedData.toString());
				try {
					if(returnedData.has("_id")){
						Log.d("LogIn","returnd data with id ="+returnedData.getString("_id"));
						Intent newIntent = new Intent(LogIn.this, GamesList.class);
						startActivity(newIntent);
					}else{
						Toast toast = Toast.makeText(LogIn.this, returnedData.getString("error"), Toast.LENGTH_LONG);
						toast.show();
						Log.d("LogIn","returnd data = null yeaaaa");
					}
				} catch (JSONException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		});
		
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.log_in, menu);
		return true;
	}

}
