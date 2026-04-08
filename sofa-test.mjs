import { SofascoreRepository } from '@devneonix/sofascore-api';

async function test() {
  try {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const fixtures = await SofascoreRepository.getFixtures(dateStr);
    
    // Find goztepe or galatasaray
    const match = fixtures.events.find(e => 
      e.homeTeam.name.toLowerCase().includes('göztepe'.toLowerCase()) || 
      e.awayTeam.name.toLowerCase().includes('galatasaray'.toLowerCase())
    );
    
    console.log(match);
  } catch (err) {
    console.error(err);
  }
}

test();
