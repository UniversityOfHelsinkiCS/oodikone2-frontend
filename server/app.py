from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson import json_util
from dotenv import load_dotenv
import os
import pickle
import numpy as np
import tensorflow as tf
from keras import backend

app = Flask(__name__)
load_dotenv()
app.config["MONGO_URI"] = os.getenv('MONGO_URI')
mongo = PyMongo(app)

@app.route('/ping')
def ping():
  print('someone is pinging')
  return 'pong'

@app.route('/student/<int:studentnumber>')
def get_student(studentnumber):
  print(studentnumber)
  online_users = mongo.db.students.find_one({'Opiskelijanumero': int(studentnumber)})
  return json_util.dumps(online_users)

@app.route('/students/')
def get_students():
  studentnumbers = request.args.getlist('student[]')
  numbers = list(map(int, studentnumbers))
  students = mongo.db.students.find({'Opiskelijanumero': { "$in": numbers }})
  return json_util.dumps(students)

@app.route('/averages/')
def get_averages():
  keys = request.args.keys()
  grade_students = {}
  for key in keys:
    studentnumbers = request.args.getlist(key)
    numbers = list(map(int, studentnumbers))
    students = mongo.db.students.find({'Opiskelijanumero': { "$in": numbers }})
    row_n = students.count()
    sbi = 0
    organised = 0
    surface = 0
    deep = 0
    se = 0
    int_rel = 0
    peer = 0
    align = 0
    cons_feed = 0
    for s in students:
      sbi += (s['SBI'] / row_n) if (type(s['SBI']) != str) else 0
      organised += (s['Organised'] / row_n) if (type(s['Organised']) != str) else 0
      surface += (s['Surface'] / row_n) if (type(s['Surface']) != str) else 0
      deep += (s['Deep'] / row_n) if (type(s['Deep']) != str) else 0
      se += (s['SE'] / row_n) if (type(s['SE']) != str) else 0
      int_rel += (s['IntRel'] / row_n) if (type(s['IntRel']) != str) else 0
      peer += (s['Peer'] / row_n) if (type(s['Peer']) != str) else 0
      align += (s['Align'] / row_n) if (type(s['Align']) != str) else 0
      cons_feed += (s['ConsFeed'] / row_n) if (type(s['ConsFeed']) != str) else 0
    grade_students[key] = {
      'SBI': sbi,
      'Organised': organised,
      'Surface': surface,
      'Deep': deep,
      'SE': se,
      'IntRel': int_rel,
      'Peer': peer,
      'Align': align,
      'ConstFeed': cons_feed
    }
  return json_util.dumps(grade_students)

@app.route('/test', methods=["POST"])
def test():
  """
  example request body:
  {
    "course": "TKT20002",
    "data": {
      "SBI": 1,
      "Organised": 1,
      "Surface": 1,
      "Deep": 1,
      "SE": 1,
      "IntRel": 1,
      "Peer": 1,
      "Align": 1,
      "ConsFeed": 1
    }
  }
  """
  body = request.get_json()
  course = body['course']
  data = np.array(list(body['data'].values())).reshape(1, -1)
  with backend.get_session().graph.as_default() as g:
      model = load_model(course)
      res = model.predict(np.array(data))
  return str(np.argmax(res))

def load_model(course):
  model = pickle.load(open('../models/' + course + '.sav', 'rb'))
  return model

if __name__ == '__main__':
  debug = os.getenv('ENV') == 'development'
  app.run("0.0.0.0", port=5000, debug=debug)