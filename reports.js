/**
 * Created by Eliran on 1/20/2015.
 */
var dbOperations = require('./dbOperations');

exports.getRevenueReport = function(req, res){
    var o = {
        map: function(){

            for(var i in this.bids){
                for(var j in this.bids[i].bidOptions){
                    emit(this.bids[i].id,{totalPoolAmount: this.bids[i].totalPoolAmount, participants:this.bids[i].bidOptions[j].participants.length});
                }
            }
        },
        reduce: function(k, vals){
            var result = {poolAmount: 0, participants:0};
            for(var i in vals){
                result.poolAmount = vals[i].totalPoolAmount;
                result.participants += vals[i].participants;
            }
            return result;
        },
        query: {_id: req.params.id}
    };

    dbOperations.GameModel.mapReduce(o, function(err, result){
       res.status(200).send(result);
    });

};
