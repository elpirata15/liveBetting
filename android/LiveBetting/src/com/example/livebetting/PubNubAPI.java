package com.example.livebetting;

import android.content.SharedPreferences;
import android.util.Log;
import com.pubnub.api.Callback;
import com.pubnub.api.Pubnub;
import com.pubnub.api.PubnubException;

public class PubNubAPI {
	
	private static PubNubAPI instance = null;
	
	Pubnub pubnub = null;
	
	SharedPreferences prefs;
	
	String subsribedGames = null;
	
	static boolean devflag = true;
	
	private PubNubAPI(String publish_key, String subscribe_key){
		pubnub = new Pubnub(publish_key, subscribe_key);
	}
	
	public static PubNubAPI getInstance(){
		if(instance==null){
			if(devflag){
			instance = new PubNubAPI("pub-c-d2e656c9-a59e-48e2-b5c5-3c16fe2124d2","sub-c-71b821d4-7665-11e4-af64-02ee2ddab7fe");
			}
		}
		return instance;
	}
	
	public boolean subscribeMeToGame(String channelName){
		
		
		try {
			   pubnub.subscribe(channelName, new Callback() {
			 
			       @Override
			       public void connectCallback(String channel, Object message) {
			           Log.d("PUBNUB","SUBSCRIBE : CONNECT on channel:" + channel
			                      + " : " + message.getClass() + " : "
			                      + message.toString());
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
			       public void successCallback(String channel, Object message) {
			           Log.d("PUBNUB","SUBSCRIBE : " + channel + " : "
			                      + message.getClass() + " : " + message.toString());
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
		
		return true;
	}
	
	public boolean unSubscribeMe(String channelName){
		
		pubnub.unsubscribe(channelName);
		
		return true;
	}
	
	public String getSubsribedChannels(){
		if(subsribedGames==null){
			subsribedGames = pubnub.getCurrentlySubscribedChannelNames();
		}
		return subsribedGames;
	}
}
