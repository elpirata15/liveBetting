package com.example.livebetting;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.apache.http.NameValuePair;
import org.json.JSONArray;
import android.os.AsyncTask;
import android.util.Log;

public class GamesAPI {
	
	JSONParser jsonParser = new JSONParser();
	
	//urls
	private String URL_GET_GAMES = "http://livebettingtest.herokuapp.com/getGames";
	
	private static GamesAPI instance = null;
	
	private GamesAPI(){
		
	}
	
	public static GamesAPI getInstance(){
		if(instance==null){
			instance = new GamesAPI();
		}
		return instance;
	}
	
	public JSONArray getGamesList(){
		
		
		JSONArray david = null;
		Log.d("GamesAPI","inn here");
	/*	try {
			params.put("url", URL_GET_GAMES);
		} catch (JSONException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		
		Log.d("GamesAPI","the data=="+params.toString());*/
		
		GoGet check = new GoGet();
		 try {
			 david = check.execute(URL_GET_GAMES).get();
			 Log.d("GamesAPI","david now="+david.toString());
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (ExecutionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		 Log.d("GamesAPI","david now2="+david.toString());
		return david;
		
	}
	
	public class GoGet extends AsyncTask<String,String,JSONArray>{

		@Override
		protected JSONArray doInBackground(String... args) {
			// TODO Auto-generated method stub
			
			List<NameValuePair> params = new ArrayList<NameValuePair>();
			
			JSONArray json = jsonParser.getJSONArrayFromUrl(args[0]);
	         
	         Log.d("GamesAPI","httpentity=="+json.toString());
			
			return json;
		}
		
		
	}
	
}
