package com.example.livebetting;

import java.util.ArrayList;
import java.util.Arrays;

import android.content.Context;
import android.graphics.Color;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import android.widget.ToggleButton;

public class SingleGameAdapter extends ArrayAdapter<SingleGame> {
	
	String subsribesgames = null;
	
    public SingleGameAdapter(Context context, ArrayList<SingleGame> users, String subsribesGames) {
        super(context, 0, users);
        subsribesgames = subsribesGames;
     }

     @Override
     public View getView(int position, View convertView, ViewGroup parent) {
        // Get the data item for this position
        final SingleGame game = getItem(position);    
        // Check if an existing view is being reused, otherwise inflate the view
        if (convertView == null) {
           convertView = LayoutInflater.from(getContext()).inflate(R.layout.item_single_game, parent, false);
        }
        // Lookup view for data population
        TextView gameName = (TextView) convertView.findViewById(R.id.gameName);
        TextView gameLocation = (TextView) convertView.findViewById(R.id.gameLocation);
        //final ToggleButton subscribe = (ToggleButton) convertView.findViewById(R.id.gameSubscribe);
        // Populate the data into the template view using the data object
        gameName.setText(game.name);
        gameLocation.setText(game.location);
        convertView.setTag(game.id);
        
        if(subsribesgames.contains(game.id)){
        	convertView.setBackgroundColor(Color.parseColor("#62f59d"));
        }

		//get subscribed games
		String subscribedGames = PubNubAPI.getInstance().getSubsribedChannels();
		
		Log.d("SingleGameAdapter","subsribed array:  "+subscribedGames);
		/*
		if(subscribedGames.contains(game.id)){
			Log.d("SingleGameAdapter","he is in the array");
			subscribe.setChecked(true);
		}else{

			Log.d("SingleGameAdapter","he is not in the array");
		}*/
        /*
        subscribe.setOnClickListener(new View.OnClickListener() {
			
			@Override
			public void onClick(View v) {
				// TODO Auto-generated method stub
				Log.d("SingleGameAdapter","subscribe genral state=="+subscribe.isChecked());
				String subscribedGames2 = PubNubAPI.getInstance().getSubsribedChannels();
				Log.d("SingleGameAdapter","subsribed array: 1 "+subscribedGames2);
				if(subscribe.isChecked()){
					PubNubAPI.getInstance().subscribeMeToGame(game.id);
				}else{
					PubNubAPI.getInstance().unSubscribeMe(game.id);
				}
			}
		});*/
        
        // Return the completed view to render on screen
        return convertView;
    }
} 
