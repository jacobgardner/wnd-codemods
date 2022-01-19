const _ = require('lodash'), 
  poop = require('poop'),
  thing = 5;

const dynamic = 'dyn';
const d = require(dynamic);

const env = require('wnd-env');
const {errors, shit: fuck} = require('../errors');
const mdb = require('../../mongodb').mongodb;
const customJobsCollection = mongodb.collection('customJobs');
const cloudStorageHelpers = require('../../helpers/cloudStorage');
const accountService = require('../account/service');
const jobDirectoryApi = require('../../services/jobdirectory-api');
const {scoringInputs: si} = require('./models');
const customScoringProfileHelpers = require('../../helpers/customScoringProfile');
const util = require('util');
