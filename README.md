# Intro

This started as innocent fork of aipurifier, with humidifier and other nodes sharing most of code single module seemed like best idea.

## Supported nodes
Nodes that can be currently used in node red.
### Xiaomi Purifiers (Measure/Control)
### Xiaomi Humidifiers (Measure/Control)
### Xiaomi Gateways, (MEasure)

## Interfaces for Purifiers and Humidifier
"Wire" protocol in Node-RED.

### Homekit like
in msg.payload of outputs one gets objects with layout / naming matching Homekit interfaces (payload property in connections can be used directly)

Also Control inputs match Homkit structure.

### Raw payloads
in msg.paylaod_raw one gets or sends props matching objects as in Python-Miio docs:

https://python-miio.readthedocs.io/en/latest/miio.html

# Credits
Forked from and based on work by https://github.com/andreyoshev