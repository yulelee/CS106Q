import java.io.*;
import java.text.*;
import java.util.*;
import java.util.Map.Entry;

public class BasicStatistic {

	private static class Data {
		public String[] words;
		public double mins;
		public Data(String[] words, double mins) {
			this.words = words; this.mins = mins;
		}
	}

	private static HashSet<Data> dataset = new HashSet<Data>();
	private static SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
	private static HashMap<String, ArrayList<Double>> wordsToAllTimes = new HashMap<String, ArrayList<Double>>();
	private static HashMap<String, Double> wordsToAverageTimes = new HashMap<String, Double>();
	
	private static double average;

	public static void main(String[] args) throws IOException, ParseException {
		averageTime(false);
		frequentWords(false);
		averageTimeForEachWord(false);
		basicLearning(true);
	}

	private static void averageTime(boolean verbose) throws IOException, ParseException{
		BufferedReader br = new BufferedReader(new FileReader("simplifiedHistoricalHelps.txt"));
		String line; int counter = 0; int overallCounter = 0; 
		double totalMins = 0; double overallTotalMins = 0;
		while ((line = br.readLine()) != null) {
			String[] data = line.split("\\t+");
			double mins = getMins(data[1], data[2]);
			if (mins > 1.5) {
				counter++;
				totalMins += mins;
			}
			overallCounter++;
			overallTotalMins += mins;
		}
		br.close();
		average = overallTotalMins / overallCounter;
		if (verbose) {
			System.out.println("total counts = " + overallCounter);
			System.out.println("overall average = " + overallTotalMins / overallCounter);
			System.out.println("> 2 min counts = " + counter);
			System.out.println("> 2 min average = " + totalMins / counter);			
		}
	}

	private static double getMins(String time1, String time2) throws ParseException {
		Date d1 = sdf.parse(time1);
		Date d2 = sdf.parse(time2);
		long diff = d2.getTime() - d1.getTime();
		return diff / 1000.0 / 60;
	}

	private static void frequentWords(boolean verbose) throws IOException, ParseException {
		BufferedReader br = new BufferedReader(new FileReader("simplifiedHistoricalHelps.txt"));
		HashMap<String, Integer> counter = new HashMap<String, Integer>();
		String line;  int totalWordsCount = 0;
		while ((line = br.readLine()) != null) {
			String[] data = line.split("\\t+");
			String question = data[3].replaceAll(",", " ").replaceAll("\\.", " ").replaceAll("\\?", " ");
			String[] words = question.split("\\s+");
			for (String word : words) {
				if (!counter.containsKey(word)) counter.put(word, 0);
				counter.put(word, counter.get(word) + 1);
			}
			totalWordsCount += words.length;
			dataset.add(new Data(words, getMins(data[1], data[2])));
		}
		br.close();

		// sort
		ArrayList<Map.Entry<String, Integer>> list = new ArrayList<Map.Entry<String, Integer>>(counter.entrySet());
		Collections.sort(list, new Comparator<Map.Entry<String, Integer>>() {
			@Override
			public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
				return o2.getValue() - o1.getValue();
			}
		});

		// print
		if (verbose) {
			System.out.println("Total words: " + totalWordsCount);
			for (Map.Entry<String, Integer> entry : list) {
				System.out.println(entry.getKey() + ": " + entry.getValue());
			}
		}
	}

	private static void averageTimeForEachWord(boolean verbose) {
		for (Data d : dataset) {
			for (String word : d.words) {
				if (!wordsToAllTimes.containsKey(word)) wordsToAllTimes.put(word, new ArrayList<Double>());
				wordsToAllTimes.get(word).add(d.mins);
			}
		}
		for (String word : wordsToAllTimes.keySet()) {
			double total = 0; int count = wordsToAllTimes.get(word).size();
			for (Double mins : wordsToAllTimes.get(word)) total += mins;
			wordsToAverageTimes.put(word, total / count);
		}
		if (verbose) {
			for (String word : wordsToAverageTimes.keySet()) System.out.println(word + ": " + wordsToAverageTimes.get(word));
		}
	}
	
	private static double basicLearningBaselineError() {
		double error = 0;
		for (Data d : dataset) error += (d.mins - average) * (d.mins - average);
		return Math.pow(error / dataset.size(), 0.5);
	}
	
	/*
	 * Really really basic learning, just average all of the words, 
	 * using the averages for those words before
	 */
	private static void basicLearning(boolean verbose) {
		if (verbose) System.out.println("baseline: " + basicLearningBaselineError());
		double error = 0;
		for (Data d : dataset) {
			if (d.words.length > 0) {
				int prediction = 0;
				for (String word : d.words) prediction += wordsToAverageTimes.get(word);
				prediction /= d.words.length;
				error += (prediction - d.mins) * (prediction - d.mins);
			}
		}
		if (verbose) System.out.println("error: " + Math.pow(error / dataset.size(), 0.5));
	}
}
