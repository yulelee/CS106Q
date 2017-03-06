import java.io.*;
import java.text.*;
import java.util.*;

public class BasicStatistic {

	public static void main(String[] args) throws IOException, ParseException {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
		BufferedReader br = new BufferedReader(new FileReader("simplifiedHistoricalHelps.txt"));
		String line; int counter = 0; int overallCounter = 0; 
		double totalMins = 0; double overallTotalMins = 0;
		while ((line = br.readLine()) != null) {
			String[] data = line.split("\\t+");
			Date d1 = sdf.parse(data[1]);
			Date d2 = sdf.parse(data[2]);
			long diff = d2.getTime() - d1.getTime();
			double mins = diff / 1000.0 / 60;
			if (mins > 1.5) {
				counter++;
				totalMins += mins;
			}
			overallCounter++;
			overallTotalMins += mins;
		}
		br.close();
		System.out.println("total counts = " + overallCounter);
		System.out.println("overall average = " + overallTotalMins / overallCounter);
		System.out.println("> 2 min counts = " + counter);
		System.out.println("> 2 min average = " + totalMins / counter);
	}
	
}
