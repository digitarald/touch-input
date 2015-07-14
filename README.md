# State-based Touch Input Manager

[![NPM version](http://img.shields.io/npm/v/touch-input.svg?style=flat)](https://www.npmjs.org/package/touch-input)
[![Dependency Status](http://img.shields.io/gemnasium/digitarald/touch-input.svg?style=flat)](https://gemnasium.com/digitarald/touch-input)

Gives you the status of all touches during the last frame. Each `Touch` entry represents a status of a finger touching the screen. Touch events are collected between frames and fire custom events once on `requestAnimationFrame`.

Inspired by Unity's [`Input.touches`](http://docs.unity3d.com/ScriptReference/Input-touches.html).

## Goals

* **60fps-first** – Your code should never handle touch events between frames.
* **Only order what you can eat** – One touch event per *touch* per *frame*.

## Examples

* [Immediate using state](http://digitarald.github.io/touch-input/examples/immediate/) – State-based renderer using 2D Canvas
* [DOM-based using events](http://digitarald.github.io/touch-input/examples/events/) – DOM-based renderer using 2D Canvas
