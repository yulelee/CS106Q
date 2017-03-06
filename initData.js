"use strict";

var data = {};

// some buckets out of nowhere
var b1 = {
   type: 'Conceptual',
   description: 'How to make a pancake?', 
   class: 'CS106A',
   students: ['Tomas Jefferson', 'Tomas Edison'],
   studentSuids: ['jeff5', 'edy'],
   position: '23'
};

var b2 = {
   type: 'Conceptual',
   description: 'Who are you!!!', 
   class: 'CS106B',
   students: ['James Moody'],
   studentSuids: ['moo93'],
   position: '23'
};

var b3 = {
   type: 'Debugging',
   description: 'Problem 4', 
   class: 'CS106B',
   students: ['Micheal Jackson'],
   studentSuids: ['jackson5'],
   position: '25'
};

var b4 = {
   type: 'Debugging',
   description: 'Linked List is not working, damn', 
   class: 'CS106B',
   students: ['Yue Yue'],
   studentSuids: ['yule'],
   position: '22'
};

var b5 = {
   type: 'Conceptual',
   description: 'I can\' open QT...', 
   class: 'CS106B',
   students: ['Qurry Jase', 'John Snow'],
   studentSuids: ['jase4', 'snow'],
   position: '1'
};

var b6 = {
   type: 'Debugging',
   description: 'Flood like flood.', 
   class: 'CS106A',
   students: ['Elise Landau'],
   studentSuids: ['elel'],
   position: '4'
};

var b7 = {
   type: 'Debugging',
   description: 'I am so sleepy.', 
   class: 'CS106A',
   students: ['Snor Lax'],
   studentSuids: ['poke4'],
   position: '22'
};

var b8 = {
   type: 'Conceptual',
   description: 'This is really weird, where is the lecture?', 
   class: 'CS106B',
   students: ['Amy Center'],
   studentSuids: ['cerany'],
   position: '15'
};

data.buckets = [b1, b2, b3, b4, b5, b6, b7, b8];

module.exports = data;
