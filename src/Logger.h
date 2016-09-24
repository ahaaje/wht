/*-
 * Copyright (c) 2014 Peter Tworek
 *
 *
 * Copyright (C) 2015 Olavi Haapala.
 * <harbourwht@gmail.com>
 * Twitter: @0lpeh
 * IRC: olpe
 *
 * -Renamed everything to Logger
 * -Added sending as email
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the author nor the names of any co-contributors
 * may be used to endorse or promote products derived from this software
 * without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#ifndef LOGGER_H
#define LOGGER_H

#include <QPair>
#include <QObject>
#include <QString>
#include <QMessageLogContext>
#include <QVariantMap>
#include <QContiguousCache>
#include <QAbstractListModel>

class Logger : public QAbstractListModel {
    Q_OBJECT
    Q_ENUMS(LogType)

    public:
        enum LogType {
            LOG_DEBUG = 0,
            LOG_ERROR = 1,
            LOG_WARN = 2,
            LOG_INFO = 3
        };

        static Logger& instance();

        Q_INVOKABLE void save();
        Q_INVOKABLE void send();

        Q_INVOKABLE void debug(QString msg) { _log(LOG_DEBUG, msg); }
        Q_INVOKABLE void error(QString msg) { _log(LOG_ERROR, msg); }
        Q_INVOKABLE void warn(QString msg)  { _log(LOG_WARN, msg); }
        Q_INVOKABLE void info(QString msg)  { _log(LOG_INFO, msg); }

        // QAbstractListModel
        int rowCount(const QModelIndex& parent = QModelIndex()) const;
        QVariant data(const QModelIndex &index, int role) const;
        QHash<int, QByteArray> roleNames() const;

    signals:
        void logSaved(QString path);

    private:
        explicit Logger(QObject *parent = 0);
        void _log(LogType, QString);
        static void saveLogToFile();
        static void _messageHandler(QtMsgType, const QMessageLogContext&, const QString&);

        static QtMessageHandler _original_handler;
        static QContiguousCache<QVariantMap> _log_cache;

        Q_DISABLE_COPY(Logger)
};

#endif // LOGGER_H
