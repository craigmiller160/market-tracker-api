const getConfig = async () => {
    const mongoUser = process.env.MONGO_USER;
    const mongoPass = process.env.MONGO_PASSWORD;
    const mongoAuthDb = process.env.MONGO_AUTH_DB;
    const mongoHost = process.env.MONGO_HOST;
    const mongoPort = process.env.MONGO_PORT;

    return {
        mongoUser,
        mongoPass,
        mongoAuthDb,
        mongoHost,
        mongoPort
    };
};

const buildMongoConnectionString = async () => {
    const {
        mongoUser,
        mongoPass,
        mongoAuthDb,
        mongoHost,
        mongoPort
    } = await getConfig();

    const dbName = process.env.MONGO_DATABASE;
    const profile = process.env.ACTIVE_PROFILE;
    const mongoDb = `${dbName}_${profile}`;

    const credsString = `${mongoUser}:${mongoPass}@`
    const coreConnectString = `${mongoHost}:${mongoPort}/${mongoDb}?authSource=${mongoAuthDb}`;
    const tlsString = `&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true`;

    if (profile === 'test') {
        return `mongodb://${coreConnectString}`;
    }

    return `mongodb://${credsString}${coreConnectString}${tlsString}`;
};

export default buildMongoConnectionString;