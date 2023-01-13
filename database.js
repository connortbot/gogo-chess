const { TextInputAssertions, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const balance = require('./balance.json');
var sequelize
const testing_locally = true
initialize();
//https://sequelize.org/

var GLOBAL = 0


// DATABASE TYPES //
const global_counter = sequelize.define('idcounter', {
    call: {
        type: Sequelize.INTEGER,
        unique: true,
    },
    counter: {
        type: Sequelize.INTEGER,
        unique: true
    }
})
const User = sequelize.define('User', {
	id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true
    },
	inventory: {
		type: Sequelize.STRING
	},
	gear: {
		type: Sequelize.STRING
	},
	training: {
		type: Sequelize.STRING
	},
    pity: {
        type: Sequelize.INTEGER
    },
    mwpity: {
        type: Sequelize.INTEGER
    },
    rolls: {
        type: Sequelize.INTEGER
    },
    team: {
        type: Sequelize.STRING
    }
});
const GoGo = sequelize.define('GoGo', {
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    weapon: {
        type: Sequelize.STRING
    },
    gear1: {
        type: Sequelize.STRING
    },
    gear2: {
        type: Sequelize.STRING
    },
    gear3: {
        type: Sequelize.STRING
    },
    lvl: {
        type: Sequelize.INTEGER
    }
});
const Weapon = sequelize.define('Weapon', {
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    lvl: {
        type: Sequelize.INTEGER,
    }
});
const Gear = sequelize.define('Gear',{
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true
    },
    lvl: {
        type: Sequelize.INTEGER
    },
    HP: {
        type: Sequelize.FLOAT
    },
    ATK: {
        type: Sequelize.FLOAT
    },
    CRITRATE: {
        type: Sequelize.FLOAT
    },
    CRITDMG: {
        type: Sequelize.FLOAT
    }
});


async function incrementID() {
    const gid = await global_counter.findOne();
    await gid.update({ counter: GLOBAL+1 });
    GLOBAL += 1;
}

async function createNewGoGo(gogo) {
    await GoGo.create({
        id: gogo+"#"+(GLOBAL).toString(),
        weapon: "",
        gear1: "",
        gear2: "",
        gear3: "",
        lvl: 0
    });
    await incrementID();
    return gogo+"#"+(GLOBAL-1).toString();
};

async function createNewGear(gearIdentifier) {
    await Gear.create({
        id: gearIdentifier+"#"+(GLOBAL).toString(),
        lvl: 0,
        HP: balance.Gear[gearIdentifier]["HP"],
        ATK: balance.Gear[gearIdentifier]["ATK"],
        CRITRATE: balance.Gear[gearIdentifier]["CRITRATE"],
        CRITDMG: balance.Gear[gearIdentifier]["CRITDMG"]
    });
    await incrementID();
    return gearIdentifier+"#"+(GLOBAL-1).toString();
};

async function initialize() {
	if (testing_locally) {
		sequelize = new Sequelize('database','user','password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: 'database.sqlite'
		});
	} else {
		sequelize = new Sequelize('DigitalOcean connection');
	}
    await sequelize.sync();
    
    // Add the following line when setting up your first time local development database. Run the bot once, and then comment the line.
    //global_counter.create({call: 0, counter: 0});

    const global_counterseq = await global_counter.findOne();
    const Users = await User.findAll();
    const GoGos = await GoGo.findAll();
    console.log(global_counterseq);
    console.log(Users);
    console.log(GoGos);
    GLOBAL = global_counterseq.counter;
    console.log(GLOBAL);

    //.drop = delete all tables
    //.destroy = ???
    //await Weapon.create({id: 'IronSword#2021',lvl: 1});
    //await User.update({gear: 'Weapon/IronSword#2023-Weapon/IronSword#2021'},{where: {id: '450385597631299594'}});
    

}


sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
 }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
 });


 module.exports = {
    async createNewGoGo(gogo) {
        await GoGo.create({
            id: gogo+"#"+(GLOBAL).toString(),
            weapon: "",
            gear1: "",
            gear2: "",
            gear3: "",
            lvl: 0
        });
        await incrementID();
        return gogo+"#"+(GLOBAL-1).toString();
    },
    async createNewGear(gearIdentifier) {
        await Gear.create({
            id: gearIdentifier+"#"+(GLOBAL).toString(),
            lvl: 0,
            HP: balance.Gear[gearIdentifier]["HP"],
            ATK: balance.Gear[gearIdentifier]["ATK"],
            CRITRATE: balance.Gear[gearIdentifier]["CRITRATE"],
            CRITDMG: balance.Gear[gearIdentifier]["CRITDMG"]
        });
        await incrementID();
        return gearIdentifier+"#"+(GLOBAL-1).toString();
    },
    async createNewUser(userID) {
        const GoGoID = await createNewGoGo('Sumon');
        console.log(GoGoID);
        await User.create({
            id: userID,
            inventory: GoGoID,
            gear: "",
            training: "",
            pity: 0,
            mwpity: 0,
            rolls: 0,
            team: ""
        });
    },
    async getUsers() {
        const users = await User.findAll();
        return users;
    },
    async getGoGo(id) {
        const gogo = await GoGo.findOne({where: { id: id }});
        return gogo;
    },
    async removeGoGo(userID,gogoID) {
        const gogo = await GoGo.findOne({where: {id: gogoID}});
        await gogo.destroy();
        const user = await User.findOne({where: {id: userID}});
        var inv = "";
        var team = "";
        for (let i=0; i<user.inventory.length; i++) {
            if (user.inventory[i] != gogoID) {
                if (inv == "") {
                    inv = inv+gogoID;
                } else {
                    inv = inv+"-"+gogoID
                }
            }
        }
        for (let i=0; i<user.team.length; i++) {
            if (user.team[i] != gogoID) {
                if (team == "") {
                    team = team+gogoID;
                } else {
                    team = team+"-"+gogoID
                }
            }
        }
        await user.update({inventory: inv, team: team});
    },
    // userID: String of Discord ID
    async getUser(userID) {
        const user = await User.findOne({where: {id: userID }});
        return user;
    },

    async getGear(gearID) {
        const gear = await Gear.findOne({where: {id: gearID }});
        return gear;
    },
    async getWeapon(weaponID) {
        const weapon = await Weapon.findOne({where: {id: weaponID}});
        return weapon;
    },

    async WeaponizeGoGo(gogoID,weaponID,userID) {
        const user = await User.findOne({where: {id: userID}});
        const gogo = await GoGo.findOne({where: {id: gogoID}});
        await gogo.update({weapon: weaponID});
        const userGoGos = user.inventory.split('-');
        for (let i=0; i<userGoGos.length; i++) {
            var nGoGo = await GoGo.findOne({where: {id: userGoGos[i]}});
            if (userGoGos[i] != gogoID) {
                if (nGoGo.weapon == weaponID) {
                    await nGoGo.update({weapon: ''});
                    return userGoGos[i];
                }
            }
        }
        return 'firstWeaponize';
    },
    async GearGoGo(gogoID,gearID,userID,slotnum) {
        const user = await User.findOne({where: {id: userID}});
        const gogo = await GoGo.findOne({where: {id: gogoID}});
        if (slotnum == 1) {
                await gogo.update({gear1: gearID});
        } else if (slotnum == 2) {
                await gogo.update({gear2: gearID});
        } else if (slotnum == 3) {
                await gogo.update({gear3: gearID});
        }
        const userGoGos = user.inventory.split('-');
        for (let i=0; i<userGoGos.length; i++) {
            var nGoGo = await GoGo.findOne({where: {id:userGoGos[i]}});
            if (userGoGos[i] != gogoID && nGoGo.gear1 == gearID) {
                await nGoGo.update({gear1: ''});
                return userGoGos[i];
            } else if (userGoGos[i] != gogoID && nGoGo.gear2 == gearID) {
                await nGoGo.update({gear2: ''});
                return userGoGos[i];
            } else if (userGoGos[i] != gogoID && nGoGo.gear2 == gearID) {
                await nGoGo.update({gear3: ''});
                return userGoGos[i];
            }
        }
        return 'firstGearing';
    },
    async giveGearWeapon(userID,gearID) {
        const user = await User.findOne({where: {id: userID}});
        if (user.gear == "") {
            await user.update({gear: gearID});
        } else {
            await user.update({gear: user.gear+"-"+gearID});
        }
    },

    async updateTeam(userID,teamArray) {
        const user = await User.findOne({where: {id: userID}});
        await user.update({team: teamArray});
    },

    async levelGoGo(id) {
        const gogo = await GoGo.findOne({where: {id:id}});
        const currentLvl = await gogo.lvl;
        if (currentLvl<10) {
            await gogo.update({lvl: currentLvl+1})
            return true;
        }
        return false;
    },
    async TrainNewGoGo(userID,gogoID) {
        const user = await User.findOne({where: {id:userID}});
        await user.update({training: gogoID});
        return 'WOOHOO!!!!';
    }
 }