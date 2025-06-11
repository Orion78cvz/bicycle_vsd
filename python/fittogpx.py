# -*- coding: utf-8 -*-
import os
import argparse
import logging
import datetime
import math

import collections

import fitparse

import xml.etree.ElementTree as ET

#--- wip
class TrackPointElement:
	def __init__(element):
		self.instance = element
		self.extensions = None
		self.TrackPointExtension = None


#---
def main(fname):
	ofname = fname + ".gpx"
	
	infile = fitparse.FitFile(fname)
	
	
	tree = ET.Element('gpx')
	tree.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
	tree.set("schemaLocation", "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd")
	tree.set("version", "1.1")
	tree.set("xmlns:ns3", "http://www.garmin.com/xmlschemas/TrackPointExtension/v1")
	tree.set("xmlns:ns2", "http://www.garmin.com/xmlschemas/GpxExtensions/v3")
	tree.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
	tree.set("xmlns", "http://www.topografix.com/GPX/1/1")
	
	track = ET.SubElement(tree, 'trk')
	
	track_name = ET.SubElement(track, 'name')
	track_name.text = 'Converted Data'
	track_seg = ET.SubElement(track, 'trkseg')
	
	_SMOOTHING_UNIT = 2.0
	_SMOOTHING_SIZE = 10
	oldpos = collections.deque(maxlen = _SMOOTHING_SIZE + 1) #勾配計算用, (distance, altitude) 左が最新
	for record in infile.get_messages("record"):
		track_pt = ET.SubElement(track_seg, 'trkpt')
		ext = ET.SubElement(track_pt, 'extensions')
		tpx = ET.SubElement(ext, 'ns3:TrackPointExtension')
		
		(dist, alt) = (math.nan, math.nan)
		
		for data in record:
			if data.value is None: continue
			#e = [data.name, data.value, (data.units if data.units else 'NaN')]
			#print("{0[0]} = {0[1]} [{0[2]}]".format(e))
			
			
			if data.name == 'position_lat':
				track_pt.set("lat", str(data.value * 180 / (2**31)))
			elif data.name == 'position_long':
				track_pt.set("lon", str(data.value * 180 / (2**31)))
			elif data.name == 'altitude':
				ele = ET.SubElement(track_pt, 'ele')
				ele.text = str(data.value)
				alt = data.value
			elif data.name == 'timestamp':
				v = data.value.replace(tzinfo=datetime.timezone.utc)
				time = ET.SubElement(track_pt, 'time')
				time.text = v.isoformat('T', 'milliseconds')
			elif data.name == 'cadence':
				cad = ET.SubElement(tpx, 'ns3:cad')
				cad.text = str(data.value)
			elif data.name == 'heart_rate':
				hr = ET.SubElement(tpx, 'ns3:hr')
				hr.text = str(data.value)
			elif data.name == 'temperature':
				tmp = ET.SubElement(tpx, 'ns3:atemp')
				tmp.text = str(data.value)
			elif data.name == 'distance':
				distance = ET.SubElement(tpx, 'distance')
				distance.text = str(data.value)
				dist = data.value
			else: ##TODO:↑POWERが抜けてる
				others = ET.SubElement(tpx, data.name)
				others.text = str(data.value)
		
		# 勾配計算
		# 1tickのデータではなく一定距離以上の区間で計算する
		if len(oldpos) < oldpos.maxlen:
			g = math.nan
		else:
			for op in oldpos:
				if dist - op[0] >= _SMOOTHING_UNIT * _SMOOTHING_SIZE:
					g = (alt - op[1]) * 100 / (dist - op[0])
					break
			else:
				raise RuntimeError("logic error in calculating gradient")
		if len(oldpos) == 0 or dist - oldpos[0][0] >= _SMOOTHING_UNIT:
			if not math.isnan(alt): oldpos.appendleft((dist, alt))
		
		grad = ET.SubElement(tpx, 'gradient')
		grad.text = str(g)
		#print(dist, alt, g)
	
	doc = ET.ElementTree(tree)
	ET.indent(doc, space='  ')
	doc.write(ofname, xml_declaration=True, encoding="UTF-8")
	
#----
if __name__ == "__main__":
    logging.basicConfig(level = logging.DEBUG)
    
    argpsr = argparse.ArgumentParser(description='.fit to .gpx converter')
    argpsr.add_argument('files', metavar="File", type=str, nargs='+', help=".fit file")
    args = argpsr.parse_args()
    
    for ff in args.files:
    	main(ff)

