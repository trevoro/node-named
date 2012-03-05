#!/bin/bash

for i in {1..1} ; do
  #echo $i
  dig @127.0.0.1 -p 9999 google.com
done
