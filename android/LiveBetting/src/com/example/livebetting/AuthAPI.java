package com.example.livebetting;

import java.util.concurrent.ExecutionException;

import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

public class AuthAPI {
	
	// auth api instance stuff
	private static AuthAPI instance = null;
	
	//shered prefernces key strings
	private String KEY_USER_ID = "com.example.livebetting.userid";
	private String KEY_USER_NAME = "com.example.livebetting.username";
	private String KEY_USER_PASSWORD = "com.example.livebetting.userpassword";
	private String KEY_GCM_REGISTRATION_ID = "com.example.livebetting.gcmregistrationid";
	
	SharedPreferences prefs;
	
	//server API urls
	private String URL_LOG_IN = "http://livebettingtest.herokuapp.com/login";
	private String URL_REGISTER = "http://livebettingtest.herokuapp.com/register";
	
	private AuthAPI(){
		
	}
	
	public static AuthAPI getInstance(){
		if (instance==null){
			instance = new AuthAPI();
		}
		return instance;
	}
	
	//check if shered preferences have user id, return true\false
	public boolean isLogedIn(Context conty){
		Log.d("LiveBettingAuthAPI","in is loged in1");
		prefs = conty.getSharedPreferences("com.example.livebetting", Context.MODE_PRIVATE);
		Log.d("LiveBettingAuthAPI","checking log in");
		if(prefs.getString(KEY_USER_ID, null)!=null){
			Log.d("LiveBettingAuthAPI","checking log in1");
			return true;
		}else{
			Log.d("LiveBettingAuthAPI","checking log in2");
			return false;
		}
	}
	
	
	//login section
	public JSONObject logMeIn(JSONObject params, Context conty){
		
		JSONObject david = null;
		prefs = conty.getSharedPreferences("com.example.livebetting", Context.MODE_PRIVATE);
		
		try {
			params.put("url", URL_LOG_IN);
		} catch (JSONException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		
		Log.d("the Data",params.toString());
		
		GoPost check = new GoPost();
		 try {
			 david = check.execute(params).get();
			 if(david.has("_id")){
				 prefs.edit().putString(KEY_USER_ID, david.getString("_id")).commit();
				 prefs.edit().putString(KEY_USER_NAME, david.getString("email")).commit();
				 prefs.edit().putString(KEY_USER_PASSWORD, david.getString("passs")).commit();
			 }
			 Log.d("AuthAPI","david now="+david.toString());
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (ExecutionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (JSONException e){
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		 Log.d("AuthAPI","david now2="+david.toString());
		return david;
	}
	
	public JSONObject signMeIn(JSONObject params, Context conty){
		
		JSONObject david = null;
		prefs = conty.getSharedPreferences("com.example.livebetting", Context.MODE_PRIVATE);
		
		try {
			params.put("url", URL_REGISTER);
		} catch (JSONException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		
		Log.d("the Data",params.toString());
		
		GoPost check = new GoPost();
		 try {
			 david = check.execute(params).get();
			 if(david.has("_id")){
				 prefs.edit().putString(KEY_USER_ID, david.getString("_id")).commit();
				 prefs.edit().putString(KEY_USER_NAME, david.getString("email")).commit();
				 prefs.edit().putString(KEY_USER_PASSWORD, david.getString("passs")).commit();
			 }
			 Log.d("AuthAPI","david now="+david.toString());
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (ExecutionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (JSONException e){
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		 Log.d("AuthAPI","david now2="+david.toString());
		return david;
	}
	
	public String getMyUserId(Context conty){
		prefs = conty.getSharedPreferences("com.example.livebetting", Context.MODE_PRIVATE);
		return prefs.getString("userId", "");
	}
	
}
