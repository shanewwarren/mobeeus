'use strict';

exports = module.exports = class Api {

    getData() {

        const data = {};

        data['Bill'] = this._getUserData(0,100);
        data['Rebecca'] = this._getUserData(0,100);
        data['Shane'] = this._getUserData(0,100);

        return data;
    }

    _getUserData(min, max) {

        return [...Array(5)].map((item) => {

            return Math.random() * (max - min) + min;
        });
    }

};
