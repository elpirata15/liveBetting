package com.example.livebetting;

import java.util.ArrayList;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.pubnub.api.Callback;
import com.pubnub.api.Pubnub;
import com.pubnub.api.PubnubException;

import android.os.Bundle;
import android.os.Vibrator;
import android.annotation.SuppressLint;
import android.app.ActionBar;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.animation.Transformation;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.PopupWindow;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

public class GamesList extends Activity {
	
	//pubnub stuff
	Pubnub pubnub = null;
	String subscribedGames = null;
	
	//shared preferences stuff
	SharedPreferences prefs;
	
	ListView listView;
	
	LinearLayout bidLayout;
	
	static boolean devflag = true;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_games_list);
		
		bidLayout = (LinearLayout) findViewById(R.id.popup_element_bid_element);
		Animation slide = AnimationUtils.loadAnimation(getApplicationContext(), R.anim.slide_out_to_bottom);
		bidLayout.startAnimation(slide);
		
		if(devflag){
			pubnub = new Pubnub("pub-c-d2e656c9-a59e-48e2-b5c5-3c16fe2124d2","sub-c-71b821d4-7665-11e4-af64-02ee2ddab7fe");
		}else{
			
		}
		
		prefs = this.getSharedPreferences("com.example.livebetting", Context.MODE_PRIVATE);
		
		subscribedGames = pubnub.getCurrentlySubscribedChannelNames();
		//get all available games from server and set them as list.
		JSONArray gamesList = null;
		
		gamesList = GamesAPI.getInstance().getGamesList();
		
		// Construct the data source
		ArrayList<SingleGame> arrayOfGames = new ArrayList<SingleGame>();
		// Create the adapter to convert the array to views
		SingleGameAdapter adapter = new SingleGameAdapter(this, arrayOfGames, subscribedGames);
		// Attach the adapter to a ListView
		listView = (ListView) findViewById(R.id.lvItems);
		listView.setAdapter(adapter);
		
		ArrayList<SingleGame> newGames = SingleGame.fromJson(gamesList);
		adapter.addAll(newGames);
		
		listView.setOnItemClickListener(new OnItemClickListener(){

			@Override
			public void onItemClick(AdapterView<?> arg0, final View arg1, int position,
					long arg3) {
				// TODO Auto-generated method stub
				Log.d("GamesList","pressed list item, position: "+String.valueOf(position));
				Log.d("GamesList","pressed list item, tag: "+String.valueOf(arg1.getTag()));
				//PubNubAPI.getInstance().subscribeMeToGame(String.valueOf(arg1.getTag()));
				try {
					   pubnub.subscribe(String.valueOf(arg1.getTag()), new Callback() {
					 
					       @Override
					       public void connectCallback(String channel, Object message) {
					           Log.d("PUBNUB","SUBSCRIBE : CONNECT on channel:" + channel
					                      + " : " + message.getClass() + " : "
					                      + message.toString());
					           Log.d("PUBNUB, subscribed channels",pubnub.getCurrentlySubscribedChannelNames());
					           GamesList.this.runOnUiThread(new Runnable() {
					        	    public void run() {
								       arg1.setBackground(getResources().getDrawable(R.drawable.subscribed_game_background));
								       TextView currentText = (TextView) arg1.findViewById(R.id.gameSubscribeStatus);
								       currentText.setText(getResources().getText(R.string.subscribed));
					        	    }
					        	});
					       }
					 
					       @Override
					       public void disconnectCallback(String channel, Object message) {
					           Log.d("PUBNUB","SUBSCRIBE : DISCONNECT on channel:" + channel
					                      + " : " + message.getClass() + " : "
					                      + message.toString());
					       }
					 
					       public void reconnectCallback(String channel, Object message) {
					           Log.d("PUBNUB","SUBSCRIBE : RECONNECT on channel:" + channel
					                      + " : " + message.getClass() + " : "
					                      + message.toString());
					       }
					 
					       @Override
					       public void successCallback(String channel, final Object message) {
					           Log.d("PUBNUB","message SUBSCRIBE : " + channel + " : "
					                      + message.getClass() + " : " + message.toString());
					           GamesList.this.runOnUiThread(new Runnable() {
					        	    public void run() {
					        	    	Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
					        	    	long[] vPattern = { 0, 300, 200, 200, 200, 200, 300, 200, 100, 300  };
					        	    	v.vibrate(vPattern, -1);
					        	    	showBidPopup(message);
					        	    }
					        	});
					       }
					 
					       @Override
					       public void errorCallback(String channel, Object error) {
					           Log.d("PUBNUB","SUBSCRIBE : ERROR on channel " + channel
					                      + " : " + error.toString());
					       }
					     }
					   );
					 } catch (PubnubException e) {
					   Log.d("PUBNUB",e.toString());
					 }
			}
			
		});
		
		
		
	}
	
	@SuppressLint("NewApi")
	public void showBidPopup(Object bidObject){
		Log.d("GamesList","in the popup shit  "+String.valueOf(bidObject));
		
		final JSONObject jObj = (JSONObject)bidObject;
		
		/*LayoutInflater inflater = (LayoutInflater) GamesList.this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		
		View layout = inflater.inflate(R.layout.bid_popup_layout, (ViewGroup) findViewById(R.id.popup_element_bid_element));*/
	
		//final PopupWindow pWindow = new PopupWindow(layout,WindowManager.LayoutParams.WRAP_CONTENT,WindowManager.LayoutParams.WRAP_CONTENT,true);
		
		//pWindow.showAtLocation(layout, Gravity.CENTER, 0, 0);
		
		//LinearLayout layout = (LinearLayout) findViewById(R.id.popup_element_bid_element);
		/*
		Animation slide = AnimationUtils.loadAnimation(getApplicationContext(), R.anim.blow_up);
		slide.setDuration(500);
		
		bidLayout.startAnimation(slide);*/
		
		
		
		TextView popup_title, popup_game_name;
		LinearLayout popup_bid_options_container;
		
		popup_title = (TextView) bidLayout.findViewById(R.id.popup_bid_title);
		popup_game_name = (TextView) bidLayout.findViewById(R.id.popup_bid_game_name);
		popup_bid_options_container = (LinearLayout) bidLayout.findViewById(R.id.popup_bid_options_container);
		
		try {
			popup_title.setText(jObj.getString("bidDescription"));
			popup_game_name.setText(jObj.getString("gameName"));
			final JSONArray bidOptsArray = jObj.getJSONArray("bidOptions");
			for(int i=0; i<bidOptsArray.length(); i++){
				Button btn = new Button(this);
				btn.setText(bidOptsArray.getJSONObject(i).getString("optionDescription"));
				//btn.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));
				btn.setBackground(getResources().getDrawable(R.drawable.button_background));
				btn.setPadding(5, 5, 5, 5);
				btn.setTextSize(20);
				btn.setTextColor(getResources().getColor(R.color.white));
				final String bidChoice = bidOptsArray.getJSONObject(i).getString("optionDescription");
				LinearLayout ll = new LinearLayout(this);
				ll.setOrientation(LinearLayout.VERTICAL);

				LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(
				     LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);

				layoutParams.setMargins(10, 10, 10, 10);
				btn.setOnClickListener(new View.OnClickListener() {
					
					@Override
					public void onClick(View v) {
						// TODO Auto-generated method stub
						try{
							pubnub.subscribe(jObj.getString("id"), new Callback() {
							 
						       @Override
						       public void connectCallback(String channel, Object message) {
						           Log.d("PUBNUB","bid SUBSCRIBE : CONNECT on channel:" + channel
						                      + " : " + message.getClass() + " : "
						                      + message.toString());
						           Log.d("PUBNUB, bid subscribed channels",pubnub.getCurrentlySubscribedChannelNames());
						           JSONObject mtBidObj = new JSONObject();
						           try {
									mtBidObj.put("myId", AuthAPI.getInstance().getMyUserId(GamesList.this));
							           mtBidObj.put("myBid", bidChoice);
							           pubnub.publish(jObj.getString("id"), mtBidObj, new Callback(){
							        	   public void successCallback(String channel, Object response) {
							        		    Log.d("PUBNUB",response.toString());
							        	   }
							           });
									} catch (JSONException e) {
										// TODO Auto-generated catch block
										e.printStackTrace();
									}
						       }
						 
						       @Override
						       public void disconnectCallback(String channel, Object message) {
						           Log.d("PUBNUB","bid SUBSCRIBE : DISCONNECT on channel:" + channel
						                      + " : " + message.getClass() + " : "
						                      + message.toString());
						       }
						 
						       public void reconnectCallback(String channel, Object message) {
						           Log.d("PUBNUB","bid SUBSCRIBE : RECONNECT on channel:" + channel
						                      + " : " + message.getClass() + " : "
						                      + message.toString());
						       }
						 
						       @Override
						       public void successCallback(String channel, final Object message) {
						           Log.d("PUBNUB","bid message SUBSCRIBE : " + channel + " : "
						                      + message.getClass() + " : " + message.toString());
						       }
						 
						       @Override
						       public void errorCallback(String channel, Object error) {
						           Log.d("PUBNUB","bid SUBSCRIBE : ERROR on channel " + channel
						                      + " : " + error.toString());
						       }
						     }
						   );
						}catch (PubnubException e){
							Log.d("PUBNUB",e.toString());
						}catch (JSONException e){
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
					}
				});
				popup_bid_options_container.addView(btn, layoutParams);
			}
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		Log.d("GamesList","in the popup shit 9 ");
		expand(bidLayout);
	}
	
	public static void expand(final View v) {
	    v.measure(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
	    final int targetHeight = v.getMeasuredHeight();

	    v.getLayoutParams().height = 0;
	    v.setVisibility(View.VISIBLE);
	    Animation a = new Animation()
	    {
	        @Override
	        protected void applyTransformation(float interpolatedTime, Transformation t) {
	            v.getLayoutParams().height = interpolatedTime == 1
	                    ? LayoutParams.WRAP_CONTENT
	                    : (int)(targetHeight * interpolatedTime);
	            v.requestLayout();
	        }

	        @Override
	        public boolean willChangeBounds() {
	            return true;
	        }
	    };

	    // 1dp/ms
	    a.setDuration((int)(targetHeight / v.getContext().getResources().getDisplayMetrics().density));
	    v.startAnimation(a);
	}
	
	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.action_bar, menu);
		return true;
	}
	@Override
	  public boolean onOptionsItemSelected(MenuItem item) {
	    switch (item.getItemId()) {
	    // action with ID action_refresh was selected
	  /*  case R.id.action_drawer:
	      Toast.makeText(this, "drawer selected", Toast.LENGTH_SHORT)
	          .show();
	      break;*/
	    // action with ID action_settings was selected
	    case R.id.action_settings:
	      Toast.makeText(this, "Settings selected", Toast.LENGTH_SHORT)
	          .show();
	      break;
	    default:
	      break;
	    }

	    return true;
	  } 

}
