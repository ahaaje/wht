import QtQuick 2.1
import Sailfish.Silica 1.0

MouseArea {
    id: popup
    property alias title: message.text
    property alias timeout: hideTimer.interval
    property alias background: bg.color

    anchors.top: parent.top
    width: parent.width
    height: message.paintedHeight + (Theme.paddingLarge * 2)
    visible: opacity > 0
    opacity: 0.0

    Behavior on opacity {
        FadeAnimation {}
    }

    Rectangle {
        id: bg
        anchors.fill: parent
    }

    Timer {
        id: hideTimer
        triggeredOnStart: false
        repeat: false
        interval: 6000
        onTriggered: popup.hide()
    }

    function hide() {
        if (hideTimer.running)
            hideTimer.stop()
        popup.opacity = 0.0
    }

    function show() {
        popup.opacity = 1.0
        hideTimer.restart()
    }

    function notify(text, color) {
        popup.title = text
        // Save also to log
        Log.info(text)

        if (color && (typeof(color) != "undefined")) {
            bg.color = color
        }
        else {
            bg.color = Theme.secondaryHighlightColor
        }
        show()
    }

    Label {
        id: message
        anchors.verticalCenter: popup.verticalCenter
        font.pixelSize: Theme.fontSizeMedium
        font.bold: true
        anchors.left: parent.left
        anchors.leftMargin: Theme.paddingMedium
        anchors.right: parent.right
        anchors.rightMargin: Theme.paddingMedium
        horizontalAlignment: Text.AlignHCenter
        elide: Text.ElideRight
        wrapMode: Text.Wrap
    }

    onClicked: hide()
}
