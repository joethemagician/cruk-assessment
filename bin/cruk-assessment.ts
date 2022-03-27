#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CrukAssessmentStack } from '../lib/cruk-assessment-stack';

const app = new cdk.App();
new CrukAssessmentStack(app, 'CrukAssessmentStack');
