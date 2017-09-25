#
# Author: Shawn Allen
# National Advanced Driving Simulator
# version 1.1 02.24.2017
#
#####################################################################
# python 2.7.8
#####################################################################
#
# 02.21.2017 Generate svg file from LRI
# Entities supported: roads and isxn borders included in svg output
# Lanes not yet fully supported
#
#####################################################################
# library dependencies: svgwrite-1.1.9
#####################################################################
#
# Portions of this code from: svg examples
# author:  mozman
# Created: 08.09.2010
# Copyright (C) 2010, Manfred Moitzi
# License: MIT License
#
#####################################################################
from __future__ import print_function  # mozman: Sometime you have to use Python 3

import sys
import os

######################################################################
# XML related
######################################################################
# ? BeautifulSoup? bs4
# from bs4 import BeautifulSoup
#
# import xml.dom.ext
# import xml.dom.minidom
######################################################################

import xml.etree.ElementTree as etree
from xml.etree.ElementTree import Element, SubElement, Comment, tostring



try:
    import svgwrite
except ImportError:
    # if svgwrite is not 'installed' append parent dir of __file__ to sys.path
    import sys, os
    sys.path.insert(0, os.path.abspath(os.path.split(os.path.abspath(__file__))[0]+'/..'))

param_count = len(sys.argv)
if param_count == 1:
    print ('Run this script with '"'python'"' <script> <lri_file>')
    exit()
else:
   my_file = sys.argv[1]

out_ext = '.svg'   
   
exploded_file = my_file.split("\\")
just_filename = exploded_file[len(exploded_file)-1]
base_filename = just_filename[:(len(just_filename)-4)]
svg_just_filename = base_filename + out_ext
#print(base_filename+out_ext)

if param_count == 3:
	# if there is a second argument, it's assumed as a target directory for the resultant SVG and limits files
	out_file = sys.argv[2]+"\\"+svg_just_filename
else:
	out_file = os.path.splitext(my_file)[0] + out_ext

print(out_file + ' ' + str(param_count))

# for debugging
sys.stdout = open('out.txt', 'w')

# hardcode test files
#my_file = r'_dev.lri'
#my_file = r'_dev2.lri'
#my_file = r'Springfield_B.lri'

try:
    with open(my_file) as f:
        content = [line.rstrip('\n') for line in f]
except IOError:
    print("Unable to open file", my_file)
    sys.exit()
	
def check_for_floats(point):
    # valid road check: all elements contain decimal, otherwise
    # line is not a road point

    for item in point:
        if '.' not in item:
            return False
        else:
            pass

    return True

def parse_lanes(input):
    # extract lanes from string

    input.pop() # remove last element
    return input[2::2] # every 2nd value start at 2

def format_for_svg(input):
    global min_x, min_y, max_x, max_y

 # convert to floats; negate Y coordinate for SVG
 # this function needs to be smarter and able to determine input length & content to be robust
 #   print('input for svg:', input)
 #   print('input length:', len(input))

    if input[-1] == END_REC: # if last char is '}' remove it
        input.pop()
    elif input[0] == ROAD_START: # remove 1st 2 elements
        del input[0:2]

 #       print('trimmed input to:', input)

    svg_format = [float(i) for i in input[0:2]]

 # negate Y for SVG

 #   print('svg_format length:', len(svg_format), svg_format)
 #   print('Type is:', type(svg_format))
    if len(svg_format) < 2:
        print('Error!', input)
        exit()
    svg_format[-1] *= -1

    if min_x == None: # initialize vars
        min_x = svg_format[0]
        max_x = svg_format[0]
        min_y = svg_format[1]
        max_y = svg_format[1]
 #        print('check extents:', min_x, max_y, min_y, max_y)

 #   print('svg data:', svg_format)
    if svg_format[0] <= min_x:
        min_x = svg_format[0]
    elif svg_format[0] >= max_x:
        max_x = svg_format[0]
    elif svg_format[1] <= min_y:
        min_y = svg_format[1]
    elif svg_format[1] >= max_y:
        max_y = svg_format[1]
    return svg_format

def reformat_border(inp_list):
    #remove fields that are not numbers
    b_data = []
    #b_data = inp_list[2::2]
    for m in inp_list:

        if (m == 'n') or (m == 'BORDER') or (m == 'y'):
            pass
        else:
 #            print 'm is:', m
            b_data.append(float(m))

 # invert Y coordinate

 #   print('clean bdr is:', b_data)
 #   print('bdr data length:', len(b_data))
    if len(b_data) == 2:
        # this is a pair
        b_data[1] *= -1

    else:
        step = len(b_data) / 2
 #   print('not a pair')

        for i in xrange(1, (step )):
 #      print('checking i', i)
 #      print('b_data i:', b_data[i])

            b_data[i] *= -1
 #     print('b_data i + step:', b_data[(i + step)])

            b_data[(i + step)] *= -1
 #    print('input:', inp_list)

    return b_data

def list_into_pairs(input):
    start_ind = 0
    end_ind = start_ind + 1
    pairs = []
    counter = 0

    for i in xrange(start_ind, (len(input)/2)):
        tmp = [input[start_ind],input[end_ind]]
        pairs.append(tuple(tmp))

        start_ind = end_ind + 1

        if ((end_ind + 2) > len(input)): # avoid going over list len
            end_ind += 1
        else:
            end_ind += 2
 # check output
 # print('pair_type_check:', type(pairs))
 #   for i in pairs:
 #       print('pair_item_check:', type(i))
    return pairs

def implode_list(input): # decompress list of lists

 #    print('input is:', input)

    imploded_list = [x for sublist in m for x in sublist]

 #    print('imploded:', imploded_list)

    return imploded_list


#####################################################
# main()
#####################################################

ISXN_BDR = 'BORDER'
ROAD_START = 'LONGCURVE'
LANE_REC = 'LANES'
OBJ_START = 'OBJECTS'
OPEN_REC = '{'
END_REC = '}'
END_ROADS = 'INTERSECTIONS'

all_road_points = []
lane_list = []
new_list = []
proc_rec = ''
road_points = []
road_counter = 0

TMP_BDR_LIST = []
ALL_BDR_LIST = []
border_counter = 0

# to establish document extents
min_x, max_y, max_x, min_y = None, None, None, None

# debug
line_counter = 0

 # print('length of file', len(content))
 # print('checking', content[(len(content) -1)])

 # list
 # print('Type:', type(content))

data_len = (len(content) - 1)

while line_counter < data_len:
    tokens = content[line_counter].split()
    line_counter += 1

    if LANE_REC in tokens:
 #        print('Lane length:', len(tokens))
        del tokens[0:2]
        del tokens[-1]
        if len(tokens) < 3:
#            lane_list.append(float(tokens[0]))
            lane_list.append([float(tokens[0])])
        else:
            lanes = (tokens[2::2])
            float_lanes = [float(i) for i in lanes[:]]
 #            print('test lanes:',float_lanes, type(float_lanes[0]))
            lane_list.append(float_lanes)

 #        lane_list.append(lanes)
 #        print('LANE Check:', lanes)

    elif ROAD_START in tokens:
        # ['LONGCURVE', '{', '2379.000000', '968.649719', '-0.000000', '0.000000', '0.000000', '1.000000']

 #       print('Starting road:', tokens)
        # r_point = tokens[2:4]
 #       print('point:', tokens)

        road_counter += 1
 #       print('road count is:', road_counter)

        if len(tokens) > 2:
            svg_points = format_for_svg(tokens)
            road_points.append(svg_points)

        while END_REC not in tokens:
            tokens = content[line_counter].split()
            line_counter += 1

            if END_REC in tokens:
                if check_for_floats(tokens[0:(len(tokens) - 1 )]):
                    #road_points.append(tokens[0:2])
 #                   print('Test interior road points', (tokens[0:2]))

 #                    svg_points = format_for_svg(tokens[0:(len(tokens) - 1 )])
                    svg_points = format_for_svg(tokens[0:(len(tokens) - 1 )])
 #                   print('checking svg points:', svg_points)

                    road_points.append(svg_points)

            else:
                if check_for_floats(tokens):
                    svg_points = format_for_svg(tokens[0:(len(tokens) - 1 )])
 #                   print('checking interior svg points:', svg_points)
                    road_points.append(svg_points)

 #        print('count is:', road_counter)
 #        road_counter += 1
        all_road_points.append(road_points)
        road_points = []

    elif END_ROADS in tokens:
        while OBJ_START not in tokens:
            tokens = content[line_counter].split()
            line_counter += 1
            if ISXN_BDR in tokens:
                border_counter += 1
                while 'CRDR' not in tokens:
                    TMP_BDR_LIST.append(reformat_border(tokens))
                    tokens = content[line_counter].split()
                    line_counter += 1
                ALL_BDR_LIST.append(TMP_BDR_LIST)
                TMP_BDR_LIST = []

counter = 0

######################################################################
# reformat data into two-tuples in preparation for svg output
######################################################################

 # print('extents', min_x, min_y, max_x, max_y)
 # extents 0.0 -5940.0 3960.0 -0.0

dwg = svgwrite.Drawing(out_file, profile='full')  # mozman: SVG Full 1.1

 # syntax:
 # <svg width="800" height="600" viewbox="0 0 800 600">

######################################################################
# Document extents
# add 330 border to comply with tile model conventions
######################################################################

edge_margin = 330

min_x = (min_x - edge_margin)
max_x = (max_x + edge_margin)
min_y = (min_y - edge_margin)
max_y = (max_y + edge_margin)

vbox_min_x = (int(min_x))
vbox_min_y = abs(int(min_y))
vbox_max_y = abs(int(max_y))

vbox_width = (abs(int(min_x))) + (abs(int(max_x)))
vbox_height = (abs(int(min_y))) + (abs(int(max_y)))
vbox_origin_y = vbox_min_y * -1

# report UL, W, Ht data

print('                   UL_X  UL_Y  W     Ht')
print('doc_extent_values:',vbox_min_x, vbox_origin_y, vbox_width, vbox_height)
# print('doc_extent_fields: vbox_min_x, vbox_origin_y, vbox_width, vbox_height')

dwg.viewbox(vbox_min_x, vbox_origin_y, vbox_width, vbox_height)

for m in all_road_points:
#    print('ROAD_')
#    print(lane_list[counter])
#    counter += 1
#    for n in m:
#        print('rd_pts:', n)
    tmp_roads = implode_list(m)
#    print('Check imploded roads:', tmp_roads)
#    print('imploded length:', len(tmp_roads))
#    print('imploded type:', type(tmp_roads))
    all_roads = list_into_pairs(tmp_roads)
    
 #    print('ROADWAY:', len(all_roads), all_roads)
    line = dwg.add(dwg.polyline(
        all_roads,
        stroke='white', fill='none', stroke_width=70))


for m in ALL_BDR_LIST:
#    print('BORDER_')
#    for n in m:
#        print('bdr length:', len(n))
#        print('bdr:', n)
#    poly = [x for sublist in m for x in sublist]
    poly = implode_list(m)
    svg_pairs = list_into_pairs(poly)
    
#    print('Polygon:', len(svg_pairs), svg_pairs)
    line = dwg.add(dwg.polyline(
        svg_pairs,
        stroke='lightgrey', fill='white'))

#################################################
# SVG save
#################################################
# doesn't work but should acc to mozman
# Drawing.save(pretty=True)

dwg.save()

print('Processing LANES now.')
for m in lane_list:
    lane_width = sum(m)
    print('Width is:', lane_width)

blip = [x for sublist in lane_list for x in sublist]
print('lanes:', blip)

exit()

