import _ from 'lodash';
import poop from 'poop';
const thing = 5;

const dynamic = 'dyn';
// :WND-CODEMODS: Unable to automatically transform to import
const d = require(dynamic);

import env from 'wnd-env';
import { errors, shit as fuck } from '../errors';
import { mongodb as mdb } from '../../mongodb';
const customJobsCollection = mongodb.collection('customJobs');
import cloudStorageHelpers from '../../helpers/cloudStorage';
import accountService from '../account/service';
import jobDirectoryApi from '../../services/jobdirectory-api';
import { scoringInputs as si } from './models';
import customScoringProfileHelpers from '../../helpers/customScoringProfile';
import util from 'util';
