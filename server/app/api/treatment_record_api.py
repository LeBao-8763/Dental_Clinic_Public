from app.dao import dao_service
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import service_model, service_parser, service_ns

@service_ns.route('/')
class TreatmentRecord(Resource):

