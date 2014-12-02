package com.example.livebetting;

import java.io.IOException;
import java.io.UnsupportedEncodingException;

import org.apache.http.HttpResponse;
import org.apache.http.ParseException;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.util.Log;

public class GoPost extends AsyncTask<JSONObject,Void,JSONObject>{

	/* (non-Javadoc)
	 * @see android.os.AsyncTask#onPreExecute()
	 */
	@Override
	protected void onPreExecute() {
		// TODO Auto-generated method stub
		super.onPreExecute();
	}

	@Override
	protected JSONObject doInBackground(JSONObject... params) {
		// TODO Auto-generated method stub
	/*	JSONObject json2 = new JSONObject();
		
		Log.d("in do in background",params[0].toString());
		try {
			json2.put("email", params[0].getString("email"));
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		try {
			json2.put("pass", params[0].getString("pass"));
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}*/
		
		StringEntity jsonstring = null;
		
		try {
			Log.d("GoPost","go posta1111111");
			jsonstring = new StringEntity(params[0].toString());
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		jsonstring.setContentType("application/json;charset=UTF-8");

		Log.d("GoPost","go posta222222222222");
		DefaultHttpClient zeclient = new DefaultHttpClient();

		Log.d("GoPost","go posta333333333333333");
		HttpPost posta = null;
		try {
			posta = new HttpPost(params[0].getString("url"));

		} catch (JSONException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		
		posta.setEntity(jsonstring);

		Log.d("GoPost","go posta444444444444");
		HttpResponse responsa = null;
		
		try {
			responsa = zeclient.execute(posta);

			Log.d("GoPost","go posta5555555555");
		} catch (ClientProtocolException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		String resposestring = null;
		try {
			resposestring = EntityUtils.toString(responsa.getEntity());

			Log.d("GoPost","resposestring==="+resposestring);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		JSONObject json3 = null;
		
		try {
			json3 = new JSONObject(resposestring);

			Log.d("GoPost","go posta66666666666");
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return json3;
	}
	
	/* (non-Javadoc)
	 * @see android.os.AsyncTask#onPostExecute(java.lang.Object)
	 */
	@Override
	protected void onPostExecute(JSONObject result) {
		// TODO Auto-generated method stub
		super.onPostExecute(result);
	}
	
}
