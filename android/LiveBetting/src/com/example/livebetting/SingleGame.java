package com.example.livebetting;

import java.util.ArrayList;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class SingleGame {
	public String id, name, location, status;
	
	public SingleGame(JSONObject object){
		try {
			this.id = object.getString("_id");
			this.name = object.getString("gameName");
			this.location = object.getString("location");
			this.status = object.getString("status");
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public static ArrayList<SingleGame> fromJson(JSONArray jsonObjects) {
        ArrayList<SingleGame> games = new ArrayList<SingleGame>();
        for (int i = 0; i < jsonObjects.length(); i++) {
            try {
            	games.add(new SingleGame(jsonObjects.getJSONObject(i)));
            } catch (JSONException e) {
               e.printStackTrace();
            }
       }
       return games;
	}
	
}
