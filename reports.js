/**
 * Created by Eliran on 1/20/2015.
 */
var dbOperations = require('./dbOperations');

exports.getRevenueReport = function(req, res){
    var o = {
        map: function(){

            for(var i in this.bids){
                for(var j in this.bids[i].bidOptions){
                    emit(this.bids[i].id,{totalPoolAmount: this.bids[i].totalPoolAmount, participants:this.bids[i].bidOptions[j].participants.length, gameName: this.gameName, gameId: this._id,
                    timestamp: this.timestamp});
                }
            }
        },
        reduce: function(k, vals){
            var result = {poolAmount: 0, participants:0, gameName: null, gameId: null, timestamp: null};
            for(var i in vals){
                result.poolAmount = vals[i].totalPoolAmount;
                result.participants += vals[i].participants;
                result.gameName = vals[i].gameName;
                result.gameId = vals[i].gameId;
                result.timestamp = vals[i].timestamp;
            }
            return result;
        }
        , query: req.body.filter
    };

    dbOperations.GameModel.mapReduce(o, function(err, result){
        var finalResult = {};
        for(var i in result){
            if(!finalResult[result[i].value.gameId]){
                finalResult[result[i].value.gameId] = {totalPools: 0, totalParticipants: 0,gameName: result[i].value.gameName,bidNumber:0};
            }
            finalResult[result[i].value.gameId].totalPools += result[i].value.poolAmount;
            finalResult[result[i].value.gameId].totalParticipants += result[i].value.participants;
            finalResult[result[i].value.gameId].bidNumber++;
            finalResult[result[i].value.gameId].timestamp = result[i].value.timestamp;
        }
        res.status(200).send(finalResult);
    });

};
