import java.io.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

import org.jsoup.*;
import org.jsoup.select.*;
import org.jsoup.nodes.*;

public class Crawler {
	public static void main(String[] args) throws IOException, InterruptedException {
		
		final String USER_AGENT = "\"Mozilla/5.0 (Windows NT\" +\n" +  
				"          \" 6.1; WOW64) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.120 Safari/535.2\"";  
		
		String seedUrl = "https://cs198.stanford.edu/cs106/auth/section/StaffRoster.aspx";  

		HashMap<String, String> cookies = new HashMap<String, String>();
		
		cookies.put("ASP.NET_SessionId", "");
		cookies.put("__utma", "");
		cookies.put("__utmb", "");
		cookies.put("__utmc", "");
		cookies.put("__utmt", "");
		cookies.put("__utmz", "");
		cookies.put("webauth_at", "");
		Connection.Response seedPage = Jsoup.connect(seedUrl)  
		         .cookies(cookies)
		         .userAgent(USER_AGENT) 
		         .execute();
		
		Elements links = seedPage.parse().select("a[href]");
		
		System.out.println(seedPage.parse());
		
		HashMap<String, String> idToNames = new HashMap<String, String>();
		
		for (Element link : links) {
			if (link.attr("abs:href").indexOf("Profile") >= 0 && link.attr("abs:href").indexOf("id") >= 0) {
				
				System.out.println(link.attr("abs:href"));
				Connection.Response personPage = Jsoup.connect(link.attr("abs:href"))  
				         .cookies(cookies)
				         .userAgent(USER_AGENT) 
				         .execute();
				
				Document person = personPage.parse();
//				for (Element link2 : links2) {
//					if (link2.attr("abs:href").indexOf("@stanford") >= 0 || link2.attr("abs:href").indexOf("@cs.stanford") >= 0) System.out.println(link2.attr("abs:href"));
//				}
				
				String name = person.select("#ctl00_CPH_U_ViewPanel > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td:nth-child(2)").first().ownText();
				System.out.println(name);
				
				
				String id = person.select("#ctl00_CPH_U_ViewPanel > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(1) > td:nth-child(2)").first().ownText();
				System.out.println(id);
				
				idToNames.put(id, name);
				
				TimeUnit.SECONDS.sleep(1);
			}
		}
		
	    PrintWriter writer = new PrintWriter("firstLevel.txt", "UTF-8");
	    for (String id : idToNames.keySet()) {
	    	writer.println(id + " " + idToNames.get(id));
	    }
	    writer.close();		
		
	}
}
