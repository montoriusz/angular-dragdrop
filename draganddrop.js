/**
 * 
 * @author Ganaraj.Pr
 * @author montoriusz
 */
angular.module("mtDragDrop",[])
    .directive("mtDraggable", [
        '$parse',
        '$rootScope',
        function ($parse, $rootScope) {
            return function (scope, element, attrs) {
                
                var dragData = null;
                var dragStartCallback = null;
                var dropSuccessCallback = null;
                var sendChannel = attrs.mtDragChannel || "default";
                
                if (attrs.mtDrag)
                    dragStartCallback = $parse(attrs.mtDrag);
                if (attrs.mtDropSuccess)
                    dropSuccessCallback = $parse(attrs.mtDropSuccess);
                
                if (window.jQuery && !window.jQuery.event.props.dataTransfer) {
                    window.jQuery.event.props.push('dataTransfer');
                }
                
                element.attr("draggable", false);
                scope.$watch(attrs.mtDraggable, function (newValue) {
                    element.attr("draggable", newValue);
                });
                
                if (attrs.mtDragData)
                    scope.$watch(attrs.mtDragData, function (newValue) {
                        dragData = newValue;
                    });
                
                element.bind("dragstart", function (e) {
                    if (e.stopPropagation)
                        e.stopPropagation();
                    e.dataTransfer.setData("Text", angular.toJson(dragData));
                    if (dragStartCallback) {
                        scope.$apply(function () {
                            dragStartCallback(scope, {$event: e});
                        });
                    }
                    $rootScope.$broadcast("MT_DRAG_START", sendChannel);                    
                });

                element.bind("dragend", function (e) {
                    $rootScope.$broadcast("MT_DRAG_END", sendChannel);
                    if (e.dataTransfer && e.dataTransfer.dropEffect !== "none" && dropSuccessCallback) {
                        scope.$apply(function () {
                            dropSuccessCallback(scope, {$event: e});
                        });
                    }
                });


            };
        }
    ])
    .directive("mtDrop", [
        '$parse',
        '$rootScope',
        function ($parse, $rootScope) {
            return function (scope, element, attrs) {
                var dropCallback = $parse(attrs.mtDrop);
                var dropChannels   = (attrs.mtDropChannels || "default").split(',');
                var dragClass      = attrs.mtDragClass || "on-drag";
                var dragHoverClass = attrs.mtDragHoverClass || "on-drag-hover";
                var acceptDrop     = false;

                function stopEvent(e) {
                    if (e.preventDefault)
                        e.preventDefault();
                    if (e.stopPropagation)
                        e.stopPropagation();
                }

                function onDragOver(e) {
                    stopEvent(e);
                    e.dataTransfer.dropEffect = 'move';
                }

                function onDragEnter(e) {
                    stopEvent(e);
                    element.addClass(dragHoverClass);
                }
                
                function onDragLeave(e) {
                    element.removeClass(dragHoverClass);
                }

                function onDrop(e) {
                    stopEvent(e);
                    var textData = e.dataTransfer.getData("Text");
                    var data = (textData || null) && angular.fromJson(textData);
                    scope.$apply(function() {
                        dropCallback(scope, {$data: data, $event: e});
                    });
                }

                scope.$on("MT_DRAG_START", function (e, channel) {
                    if (dropChannels.indexOf(channel) !== -1) {
                        acceptDrop = true;
                        element.bind("dragover", onDragOver);
                        element.bind("dragenter", onDragEnter);
                        element.bind("dragleave", onDragLeave);
                        element.bind("drop", onDrop);
                        element.addClass(dragClass);
                    }
                });

                scope.$on("MT_DRAG_END", function (e, channel) {
                    if (acceptDrop) {
                        element.unbind("dragover", onDragOver);
                        element.unbind("dragenter", onDragEnter);
                        element.unbind("dragleave", onDragLeave);
                        element.unbind("drop", onDrop);
                    }
                    acceptDrop = false;
                    element.removeClass(dragClass);
                    element.removeClass(dragHoverClass);
                });

            };
        }
    ]);
